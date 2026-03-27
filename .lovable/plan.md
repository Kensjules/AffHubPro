

# Stripe Subscription Integration for AffHubPro Pro Plan

## Overview
Implement a full subscription payment flow using Stripe Checkout for the $29/mo Pro Plan, with subscription status tracking, customer portal access, and gated features.

## Existing Assets
- Stripe product `prod_UDrcZFHFhVw4Lo` ("AffHubPro Beta Pro") with price `price_1TFPt0DC0mn1G7R6fgPHNAzK` already exists
- `STRIPE_SECRET_KEY` is configured as an edge function secret
- Auth system and profiles table are in place
- Landing page PricingSection already displays the three-tier pricing

## Implementation Plan

### 1. Database: Add subscription columns to profiles
Add `stripe_customer_id`, `subscription_status`, and `subscription_end` columns to the `profiles` table via migration. No new tables needed.

### 2. Edge Function: `create-checkout`
Creates a Stripe Checkout session for authenticated users. Looks up or creates a Stripe customer by email, then creates a subscription checkout session with `price_1TFPt0DC0mn1G7R6fgPHNAzK`. Returns the session URL for redirect. Success URL points to `/subscription-success`, cancel URL to `/#pricing`.

### 3. Edge Function: `check-subscription`
Queries Stripe for the user's active subscription by email. Returns `{ subscribed, product_id, subscription_end }`. Called on login, page load, and periodically. No database writes — purely a Stripe lookup.

### 4. Edge Function: `customer-portal`
Creates a Stripe Customer Portal session so users can manage billing, cancel, or update payment methods. Returns the portal URL.

### 5. Frontend: Subscription Context
Create `useSubscription` hook that:
- Calls `check-subscription` on auth state change and every 60 seconds
- Exposes `{ isSubscribed, subscriptionEnd, isLoading, refreshSubscription }`
- Integrated into AuthContext or as a standalone context

### 6. Frontend: Update PricingSection
- Pro plan "Start Free Trial" button calls `create-checkout` for authenticated users, or redirects to `/signup` for unauthenticated users
- Show "Your Plan" badge on the active plan for subscribed users
- Starter plan button links to `/signup`
- Agency plan button stays as "Join Waitlist"

### 7. Frontend: `/subscription-success` page
Simple success confirmation page after checkout. Triggers a subscription status refresh and redirects to dashboard after a few seconds.

### 8. Frontend: Manage Subscription in Settings
Add a "Subscription" section to the Settings page showing current plan status and a "Manage Subscription" button that opens the Stripe Customer Portal.

### 9. Routes
Add routes for `/subscription-success` in App.tsx (protected).

## Files Created
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `src/hooks/useSubscription.ts`
- `src/pages/SubscriptionSuccess.tsx`

## Files Modified
- `src/components/landing/PricingSection.tsx` — subscribe button logic + active plan indicator
- `src/pages/Settings.tsx` — subscription management section
- `src/App.tsx` — add `/subscription-success` route
- `supabase/config.toml` — add function configs

## Security
- Stripe secret key stays server-side only (edge functions)
- JWT validated in all edge functions via `getUser(token)`
- No sensitive data exposed to the client
- Customer lookup by authenticated email only

