# UrbanThreads Integration with Gameball Integration Notes

## High Level Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js /TS|
| Backend | NestJS /TS |
| Database | **PostgreSQL + Prisma ORM** |
| Payments | **Stripe Integration** |
| Auth | **JWT in httpOnly cookies** |
| Deployment | Docker Compose (DB+BE+FE) |
| Attachments | Cloudinary (when dockerized) / local filesystem (dev for me) |

## Gameball Integration

All Gameball interaction goes through a single service: `backend/src/gameball/gameball.service.ts`

- Base URL: `https://api.gameball.co/api/v4.0/integrations`
- Auth headers: `apikey (GAMEBALL_API_KEY) + secretkey (GAMEBALL_SECRET_KEY) (I am turning maximum security option off)`

## Gameball API Endpoints Used

| Endpoint | Purpose |
|---|---|
| **POST /customers** | Create/update customer profile |
| **POST /events** | To track profile_completed and write_review events |
| **POST /orders** | To track purchase for point earning (didn't use payments because it is an ecommerce website not a payment/fintech platform) |
| **POST/ transactions/hold** | Hold points for redemption at checkout (My architecture is that I hold points first then confirm redemption once payment is successful) |
| **DELETE /transactions/hold/{ref}** | Release held points if the user's payment fail for any reason after holding points |
| **POST /transactions/redeem** | Finalize point redemption after payment is successful |
| **GET /customers/{id}/balance** | Fetch current point balance, available points, pending points, expiring points and more loyalty information |
| **GET /customers/{id}/tier-progress** | Fetch tier progress for the logged in user |
| **GET /configurations/tiers** | Fetch all tier definitions from the existing configuration. |
| **GET /customer/{id}** | Fetch loyalty profile (points, tier, badges) |

### I also integrated the gameball widget, the app embeds gameball's loyalty widget on the logged in user screens, and handled the new optional session token in the integration.

## Assumptions I made

#### 1. Using POST /orders instead of POST /payments for order tracking
I used /orders because this is an ecommerce app rather than a fintech platform.

#### 2. OTP is disabled
I hardcode ignoreOtp: true on every hold and redeem call and never collect an OTP from the user.

#### 3. Hold expiry is long enough for checkout
Gameball point holds have a default 10 min expiry (configurable in dashboard). My cart stores the holdReference with no expiry tracking or refresh logic

#### 4. Fire and forget is acceptable for point redemption
There is no retry queue.

#### 5. No refund/reversal handling, coupon and cash back mentioned in the requirements

#### 6. Widget token generation via JWS+JWE for session token (not /hash endpoint)
I generate widget authentication tokens on the backend: sign a JWT, then encrypt with JWE using the Gameball secret key

#### 7. Single currency (USD)
All Stripe charges are in USD

#### 8. Admin access via static 4-digit PIN
Admin registration is guarded by a single ADMIN_PIN env var shared across all admins

#### 9. Order status transitions are not validated
Admin can set any status on any order, No state machine enforcing specific transitions

## What I Would Do Differently in a Production Integration

#### Replace fire and forget with a message queue
Stripe may charge the user a reduced amount (discount applied), but redeemPoints() may silently fail. In prod, I would persist call to gameball by pushing to a job queue,same applies to trackOrder().

#### Concurrent Requests Handling

#### Add automated tests

#### Add email verification

#### Replace static admin PIN

#### Stock reservation with decrement
In prod I would reserve stock when creating the PaymentIntent to prevent overselling.

## Check more detailed integration document I made in the extras folder along with videos pointing out all required integrations working.