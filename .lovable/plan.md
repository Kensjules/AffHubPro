

# Store Webhook Secret + Fix check-subscription + Create Webhook Handler

## What's happening
You've provided the Stripe webhook secret (`whsec_rADi...`). This needs to be stored as a backend secret and used by a new webhook edge function. The `check-subscription` function also still has the "Invalid time value" bug on line 68 that needs fixing.

## Plan

### 1. Store `STRIPE_WEBHOOK_SECRET` as a backend secret
Use the `add_secret` tool to store `whsec_rADiQHIAOdb3s424Zt9ICsBC1gJmCvBw` as `STRIPE_WEBHOOK_SECRET`.

### 2. Fix `check-subscription` date parsing bug (line 68)
Replace the crash-prone `new Date(subscription.current_period_end * 1000).toISOString()` with defensive parsing:
```ts
let endDate: string | null = null;
try {
  const raw = subscription.current_period_end;
  const ts = typeof raw === "number" ? raw * 1000 : Date.parse(String(raw));
  endDate = isNaN(ts) ? null : new Date(ts).toISOString();
} catch { endDate = null; }
subscriptionEnd = endDate;
```

### 3. Add `subscription_status` and `stripe_customer_id` columns to profiles
Database migration to add these columns so webhook can persist status:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
```

### 4. Create `stripe-webhook` edge function
New file `supabase/functions/stripe-webhook/index.ts` that:
- Verifies the Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handles `checkout.session.completed` and `customer.subscription.updated/deleted` events
- Updates `profiles.subscription_status` and `stripe_customer_id` using `client_reference_id` or customer email lookup
- Add config entry in `supabase/config.toml`

### 5. Update `check-subscription` to also sync profiles
After reading subscription status from Stripe, write it back to the profiles table so realtime listeners can pick it up.

### 6. Add realtime listener in `useSubscription` hook
Subscribe to `profiles` table changes for the current user so the UI updates instantly when the webhook writes to the database.

## Files Modified/Created
| File | Action |
|---|---|
| Secret: `STRIPE_WEBHOOK_SECRET` | Store |
| `supabase/functions/check-subscription/index.ts` | Fix date bug + sync to profiles |
| `supabase/functions/stripe-webhook/index.ts` | Create |
| `supabase/config.toml` | Add webhook function config |
| `src/hooks/useSubscription.ts` | Add realtime listener |
| Migration | Add columns to profiles |

