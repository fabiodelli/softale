# 💳 04. Payments

## 🏦 Infrastructure
 We use **Stripe** for all billing.
*   **Mode**: Subscription (Recurring).
*   **Tiers**:
    *   **Free**: Limited access (some stories locked).
    *   **Premium**: Full access, offline mode (future), higher quality.

## 📦 Products & Prices
Defined in `src/config/stripe.ts` (or fetched dynamically).

| Tier | Price ID | Description |
| :--- | :--- | :--- |
| **Monthly** | `price_...` | Standard monthly subscription. |
| **Yearly** | `price_...` | Discounted annual plan. |
| **Lifetime** | `price_...` | (Experimental) One-time payment. |

## 🔄 The Webhook Flow
This is critical for managing access.
1.  **User Pays** on Stripe Checkout.
2.  Stripe sends `checkout.session.completed` to `/api/webhooks/stripe`.
3.  **Server Action**:
    *   Finds user by `client_reference_id` or email.
    *   Updates `users.subscription_status` to `'active'`.
    *   Updates `users.stripe_customer_id`.

## ⚠️ Important Scenarios
*   **Cancellation**: User cancels -> Status remains `'active'` until `current_period_end`. Then webhook `customer.subscription.deleted` fires -> Status becomes `'canceled'`.
*   **Failed Payment**: Webhook `invoice.payment_failed` -> Status `'past_due'`. App should prompt user to update card.

## 💻 Frontend Integration
*   **Upgrade Page**: `/upgrade`
*   **Portal**: `/account` -> "Manage Subscription" (Redirects to Stripe Customer Portal).
