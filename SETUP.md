# Setup Instructions

This guide walks you through running the project locally. No programming experience is required,just follow the steps in order.

## Requirements

**Docker** (Desktop preferred)
Download it from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

## Step-by-Step Setup

**1. Get the project files**
Clone (or download) this GitHub repository into your IDE or a folder on your machine.

**2. Add the environment file**
Locate the `.env.docker` file included in the bundled deliverables sent to you by email. Place this file in the **root folder of the project** (the same level as this README).
> This file contains the configuration secrets needed to run the app. Do not rename it.

**3. Start the application**
Open a terminal in the project root folder and run:

```
docker compose --env-file .env.docker up --build
```

**4. Wait for the app to be ready**

Watch the terminal output. Once you see this line, the app is fully up:
```
Backend running on http://localhost:4000
```

**5. Open the app in your browser**

Navigate to: [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

Use the following pre-loaded admin account to log in:

| Field    | Value           |
|----------|-----------------|
| Email    | admin@test.com  |
| Password | Admin@123       |

---

## Additional Notes

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
