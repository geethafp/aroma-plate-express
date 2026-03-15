

# Razorpay Checkout, Order Persistence, and SMS Notifications

## Overview

Add Razorpay payment gateway to the checkout flow, persist orders in the database, and send SMS confirmations via Twilio on successful payment.

## Architecture

```text
Cart (confirm step)
  → "Pay Now" button
  → Edge Function: create-razorpay-order (creates order in DB + Razorpay order)
  → Razorpay Checkout modal opens
  → On success → Edge Function: verify-payment (verifies signature, updates DB, sends SMS via Twilio)
  → Redirect to /order-success page
```

## Requirements Before Implementation

Two secrets are needed:
- **RAZORPAY_KEY_ID** — public key, stored in codebase as env var
- **RAZORPAY_KEY_SECRET** — private key, stored as a backend secret

Twilio connector will be linked for SMS notifications. You will be prompted to connect your Twilio account.

## Step-by-Step Plan

### 1. Database Tables

**`orders`** table:
- `id` (uuid, PK), `customer_name`, `customer_phone`, `address_line1`, `address_line2`, `city`, `state`, `pincode`
- `delivery_date`, `delivery_time`, `total_amount` (integer, paise)
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
- `payment_status` (text, default 'pending': pending/paid/failed)
- `created_at`

**`order_items`** table:
- `id` (uuid, PK), `order_id` (FK → orders), `item_id`, `item_name`, `item_price`, `quantity`

RLS: Open insert for anonymous orders (no auth required for placing orders). Select restricted to service role only for admin access.

### 2. Edge Function: `create-razorpay-order`

- Receives cart items, address, delivery schedule from frontend
- Inserts order + order_items into database with status 'pending'
- Calls Razorpay Orders API (`POST https://api.razorpay.com/v1/orders`) with amount in paise
- Returns `razorpay_order_id` and `order_id` to frontend

### 3. Edge Function: `verify-payment`

- Receives `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `order_id`
- Verifies HMAC SHA256 signature using RAZORPAY_KEY_SECRET
- Updates order record with payment details and status = 'paid'
- Sends SMS via Twilio gateway with order confirmation message
- Returns success/failure

### 4. Frontend Changes

- **`index.html`**: Add Razorpay checkout.js script tag
- **`Cart.tsx`**: Replace "Place Order" with "Pay ₹X" button that:
  1. Calls `create-razorpay-order` edge function
  2. Opens Razorpay checkout modal with order details
  3. On success, calls `verify-payment` edge function
  4. Navigates to `/order-success`
- **New `OrderSuccess.tsx` page**: Shows payment confirmation with order ID and items summary
- **`App.tsx`**: Add `/order-success` route

### 5. SMS via Twilio

Connect Twilio using the connector. The `verify-payment` edge function will send an SMS like:
> "Thank you {name}! Your order #{id} for ₹{amount} has been confirmed. Delivery on {date} at {time}."

## Secrets Required

| Secret | Type | Purpose |
|--------|------|---------|
| RAZORPAY_KEY_ID | Backend secret | Razorpay public key (also used in frontend via edge function response) |
| RAZORPAY_KEY_SECRET | Backend secret | Razorpay signature verification |
| Twilio (via connector) | Connector | SMS delivery |

