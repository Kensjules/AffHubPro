

# Fix Stripe Subscription Status Not Reflecting After Checkout

## Root Cause

The edge function logs reveal the problem clearly. The `check-subscription` function successfully authenticates the user and finds their Stripe customer, but then **fails** when trying to list subscriptions:

```
The provided key 'rk_test_...QEJj39' does not have the required permissions for this endpoint.
Having the 'rak_billing_cadence_read', 'rak_subscription_read' permissions would allow this request to continue.
```

The `STRIPE_SECRET_KEY` stored in the backend is a **restricted key** (`rk_test_...`) that lacks permissions to read subscriptions. The `check-subscription` function errors out, so the UI always shows "Starter Plan (Free)".

This is **not** a webhook issue or a UI refresh issue — the subscription check itself fails at the Stripe API level.

## Fix

### 1. Update the Stripe Secret Key (required — user action)

The restricted key needs the `rak_subscription_read` and `rak_billing_cadence_read` permissions added. The user must either:

- **Option A**: Go to Stripe Dashboard → API Keys → edit the restricted key to add "Subscriptions: Read" and "Billing cadence: Read" permissions
- **Option B**: Replace the restricted key with a full `sk_test_...` secret key

Then update the `STRIPE_SECRET_KEY` secret in the backend.

### 2. Add `client_reference_id` to checkout session (code change)

In `supabase/functions/create-checkout/index.ts`, add `client_reference_id: user.id` to the checkout session creation. This links the Stripe session to the Supabase user for future webhook support.

### 3. Add aggressive retry polling on SubscriptionSuccess page (code change)

In `src/pages/SubscriptionSuccess.tsx`, change `refreshSubscription()` to poll every 2 seconds for 30 seconds until `isSubscribed` becomes true, ensuring the UI reflects the new status even if there's a brief Stripe propagation delay.

### 4. Force refresh on Settings subscription tab mount (code change)

In `src/pages/Settings.tsx`, call `refreshSubscription()` when the subscription tab is activated, ensuring the latest status is always fetched.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/create-checkout/index.ts` | Add `client_reference_id: user.id` |
| `src/pages/SubscriptionSuccess.tsx` | Add polling retry until subscription confirmed |
| `src/pages/Settings.tsx` | Refresh subscription on tab switch |

## Critical User Action Required

The Stripe restricted key must be updated with subscription read permissions, or replaced with a full secret key. Without this, no code change will fix the issue.

