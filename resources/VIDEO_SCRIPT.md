# Loom Video Script — Gameball Integration Walkthrough

> Target: 5–7 minutes | Audience: Customer's development team
> Share screen throughout. Have the code editor, visual architecture doc, and optionally the Gameball dashboard ready in separate tabs.

---

## INTRO (0:00 – 0:30)

**Show:** Visual Architecture doc — Slide 1 (System Overview)

> "Hey team — I'm Mohamed, and I'll walk you through how UrbanThreads integrates with Gameball's loyalty platform.
>
> Quick context: UrbanThreads is a Next.js + NestJS e-commerce app. All Gameball communication happens server-side through a single service — the frontend never calls Gameball directly. This is important for security, and I'll explain why later.
>
> Let me show you the architecture, then walk through the code, and wrap up with practical tips for production."

---

## SECTION 1 — Integration Architecture (0:30 – 1:30)

**Show:** Visual Architecture doc — Slide 2, then Slide 3

> "Everything flows through one file: `gameball.service.ts`. It's a NestJS injectable service that wraps an Axios client pointed at Gameball's v4.0 integrations API.
>
> It authenticates with two headers — `apikey` and `secretkey` — both loaded from environment variables. Every request has a 10-second timeout and automatic retry with exponential backoff — but only for server errors. Client errors like 422 fail immediately because retrying won't fix them.
>
> *[scroll to Slide 3]*
>
> Here's the customer lifecycle — when each Gameball API gets called. Registration creates the customer, profile updates sync attributes and fire a one-time `profile_completed` event, reviews trigger `write_review`, and the checkout flow handles order tracking and point redemption.
>
> Notice the pattern — most write operations are fire-and-forget. The user's experience never blocks on Gameball's response. But read operations like fetching the balance or tier progress are awaited, because we need to display that data."

---

## SECTION 2 — Code Walkthrough (1:30 – 4:30)

### 2A — Customer Registration (1:30 – 2:00)

**Show:** `backend/src/auth/auth.service.ts` → line 54–63

> "When a user registers, after we create the user record and generate JWT tokens, we fire off `createOrUpdateCustomer` as fire-and-forget.
>
> *[highlight the `.catch` pattern]*
>
> See this pattern — `.catch(err => console.error(...))`. If Gameball is down, registration still succeeds. The customer will get synced on their next profile update."

### 2B — Profile Events (2:00 – 2:30)

**Show:** `backend/src/users/users.service.ts` → line 31–76

> "On profile update, two things happen. First, we sync the updated attributes to Gameball — name, email, phone.
>
> Then there's a one-time check: if `firstName`, `lastName`, and `phone` are all set for the first time, we fire the `profile_completed` event and flip a database flag so it never fires again. This is how you'd award points for completing a profile — configure that event in the Gameball dashboard."

### 2C — Event Tracking: Reviews (2:30 – 2:50)

**Show:** `backend/src/reviews/reviews.service.ts` → line 61–75

> "When a review is created, we fire `write_review` with metadata — the `product_id` and whether it `has_image`. On success, we mark `gameballEventSent = true` on the review record. This flag lets you audit which reviews were successfully tracked."

### 2D — Order Tracking & Points Redemption (2:50 – 4:00)

**Show:** Visual Architecture doc — Slide 4 (Hold-Then-Redeem)

> "This is the most important flow. We use a hold-then-redeem pattern for point redemption.
>
> *[walk through the diagram top to bottom]*
>
> Step one: the user clicks 'Use points' on the cart page. We call Gameball's `POST /transactions/hold`. This reserves points without deducting them, and we get back a `holdReference` which we store on the cart.
>
> Step two: at checkout, we create a Stripe PaymentIntent with a reduced amount — the original subtotal minus the points discount. The `holdReference` goes into the PaymentIntent metadata so the webhook handler can access it later.
>
> Step three: when Stripe confirms payment via webhook..."

**Show:** `backend/src/orders/orders.service.ts` → line 92–213

> "...`handlePaymentSuccess` runs. It's idempotent — first thing it does is check if an order already exists for this PaymentIntent ID. Then in a database transaction, it creates the order, order items, payment record, and clears the cart.
>
> *[scroll to lines 182–210]*
>
> After the transaction, two fire-and-forget calls: `trackOrder` sends the purchase to Gameball so the customer earns points, and `redeemPoints` finalizes the hold — actually deducting the points. If there's no holdReference, the redeem call is skipped.
>
> The safety net here is that if payment fails, the hold just expires — default 10 minutes. No points are lost."

### 2E — Balance & Widget (4:00 – 4:30)

**Show:** `backend/src/users/users.service.ts` → line 134–154, then `gameball.service.ts` → line 179–191

> "For the profile page, we fetch balance, tier progress, tier configurations, and the full loyalty profile — all in parallel with `Promise.all`.
>
> The widget uses a session token that's generated entirely server-side. We sign a JWT with the Gameball secret key, then encrypt it with JWE. The frontend gets back an opaque encrypted string, initializes the widget, and the user sees their points, tier, and badges — all without the secret key ever leaving the server."

---

## SECTION 3 — Tips & Best Practices (4:30 – 5:30)

**Show:** Visual Architecture doc — Slide 7 (Security Boundaries), then Slide 8 (Retry)

> "A few things I'd flag for your team:
>
> **Security — API Key vs. Secret Key.** The API key identifies your app — it's safe for headers and the frontend widget initialization. The secret key proves your identity and signs tokens. It should NEVER be in client-side code or source control. In our setup, only the backend has it, loaded from environment variables.
>
> **Error handling.** We retry on 5xx and timeouts with exponential backoff, but we do NOT retry 4xx errors — those are things like insufficient balance (422) or customer not found (404) that won't resolve on retry.
>
> For `holdPoints` specifically, we surface Gameball's 422 error message directly to the user — 'Insufficient balance' for example. For balance and tier queries, a 404 just returns null so the UI shows a default state instead of crashing.
>
> **The fire-and-forget trade-off.** It's great for UX, but it means `trackOrder` or `redeemPoints` could silently fail. In production, I'd replace this with a message queue — Bull or RabbitMQ — so failed calls get retried reliably. The order row already stores the `gameballHoldReference`, so you have the data to replay."

---

## SECTION 4 — Dos and Don'ts (5:30 – 6:30)

> "Let me rapid-fire some dos and don'ts:
>
> **DO: Use `/orders` for e-commerce, not `/payments`.** The orders endpoint is designed for e-commerce purchase tracking with line items. The payments endpoint is for fintech platforms.
>
> **DO: Always hold points before charging.** Never deduct points and then charge — if the charge fails, you've already taken the customer's points. The hold-then-redeem pattern exists exactly for this.
>
> **DO: Make your webhook handler idempotent.** Stripe can send the same event multiple times. We check by `stripePaymentIntentId` uniqueness — if the order exists, we return early.
>
> **DON'T: Send cashback or orders for COD (cash on delivery) at order creation.** Wait until payment is actually confirmed. If the customer rejects the delivery, you've already awarded points you can't easily claw back.
>
> **DON'T: Ignore hold expiry.** The default hold timeout is 10 minutes. If your checkout flow can take longer, either increase the timeout in the Gameball dashboard or build hold-refresh logic.
>
> **DON'T: Skip refund handling.** If you refund a Stripe charge, you should reverse the corresponding Gameball order or reward transaction. We haven't built this yet, but in production you'd listen for `charge.refunded` webhooks and call Gameball's reversal APIs.
>
> **DON'T: Forget about points expiry.** Gameball can auto-expire points. Your UI should display expiring points — the balance endpoint returns this data — so customers know to use them."

---

## CLOSING (6:30 – 7:00)

> "To wrap up — the integration boils down to three principles:
>
> One, centralize all Gameball calls in one service. It makes logging, retries, and future queue migration trivial.
>
> Two, use fire-and-forget for writes that don't block the user, and await reads that display data.
>
> Three, always hold before you charge, and always track the order only after payment is confirmed.
>
> The full architecture document and code are in the repo. Happy to answer any questions — thanks for watching."

---

## Checklist Before Recording

- [ ] Code editor open with these files tabbed:
  - `backend/src/gameball/gameball.service.ts`
  - `backend/src/auth/auth.service.ts`
  - `backend/src/users/users.service.ts`
  - `backend/src/reviews/reviews.service.ts`
  - `backend/src/orders/orders.service.ts`
  - `backend/src/cart/cart.service.ts`
- [ ] `resources/VISUAL_ARCHITECTURE.md` open in preview mode (for diagrams)
- [ ] Gameball dashboard open (optional — show event configs, tier setup)
- [ ] Practice transitions between tabs — don't fumble during recording
- [ ] Test audio + screen recording before starting
- [ ] Keep an eye on the clock — aim for ~1 min per section marker above

## Timing Reference

| Section | Topic | Target |
|---------|-------|--------|
| Intro | Context + what we'll cover | 0:00 – 0:30 |
| 1 | Architecture overview | 0:30 – 1:30 |
| 2A | Customer registration code | 1:30 – 2:00 |
| 2B | Profile events code | 2:00 – 2:30 |
| 2C | Review events code | 2:30 – 2:50 |
| 2D | Order tracking + redemption code | 2:50 – 4:00 |
| 2E | Balance + widget code | 4:00 – 4:30 |
| 3 | Tips & best practices | 4:30 – 5:30 |
| 4 | Dos and Don'ts | 5:30 – 6:30 |
| Closing | Summary + wrap up | 6:30 – 7:00 |
