# Setup Instructions

This guide walks you through running the project locally. No programming experience is required,just follow the steps in order.

## Requirements

**Docker Desktop** — available for both Windows and Mac
> Download it from [https://www.docker.com/products/docker-desktop]

> **Windows users:** During installation, Docker may ask you to enable **WSL2** (Windows Subsystem for Linux). Follow the on screen prompts to do so, it is required for Docker to work on Windows.

**Stripe CLI** — required to receive payment webhook events locally
> Download it from [https://docs.stripe.com/stripe-cli]

## Step by Step Setup

**1. Get the project files**
Clone (or download) this GitHub repository into your IDE or a folder on your machine.

**2. Add the environment file**
Find the `.env.docker` file included in the bundled deliverables sent to you by email. Place this file in the **root folder of the project** (the same level as this README).
> This file contains the configuration secrets needed to run the app. Do not rename it.

**3. Start the application**

**Option A — Launcher script (recommended)**
- **Windows:** Double-click `start.bat` in the project folder
- **Mac:** Right-click `start.sh` → **Open With** → **Terminal**

The script will build and start everything automatically, then open the app in your browser when ready.

> Mac only: if you get a permission error, open Terminal in the project folder and run `chmod +x start.sh` once, then try again.

---

**Option B — Manual (terminal)**

Open a terminal in the project root folder:
- **Windows:** Open the project folder in File Explorer, click the address bar, type `cmd`, and press Enter
- **Mac:** Right-click the project folder in Finder and select **"New Terminal at Folder"**

Then run:
```
docker compose --env-file .env.docker up --build
```

**4. Start the Stripe webhook listener**

> First time only: run `stripe login` and authenticate using the Stripe credentials in the Additional Notes section below.

Open a new terminal window and run:
```
stripe listen --forward-to localhost:4000/payments/webhook
```

Keep this terminal open while using the app — it is required for payments to complete successfully.

**5. Wait for the app to be ready**

Watch the terminal output. Once you see this line, the app is fully up:
```
Backend running on http://localhost:4000
```

**6. Open the app in your browser**

Navigate to: [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

Use the bootstrapped admin account to log in:

| Field    | Value           |
|----------|-----------------|
| Email    | admin@test.com  |
| Password | Admin@123       |

---

## Additional Notes

**Stripe Credentials**
Email: mohamedmahmoudx20@gmail.com
Password: MUser357##

**Stripe Test Payments**

To simulate a payment, use the following test card details at checkout:

| Field           | Value              |
|-----------------|--------------------|
| Card Number     | 4242 4242 4242 4242 |
| Expiry Date     | Any future date    |
| CVV             | Any 3 digits       |

**Creating a New Admin Account**
If you need to register a new admin user, use the following PIN when prompted:
```
ADMIN_PIN: 1234
```
