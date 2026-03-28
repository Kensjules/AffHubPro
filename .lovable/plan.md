

# Quick-Add Payout Feature

## Overview
Add a "+ Add Payout" button to the dashboard header that opens a Sheet (side drawer) for manually logging payouts. On save, insert into a new `payouts` table, show a success toast, and invalidate dashboard queries so cards/chart update instantly.

## Database

### New `payouts` table (migration)
```sql
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  brand_source text NOT NULL,
  category text NOT NULL DEFAULT 'direct_brand',  -- 'direct_brand' | 'network'
  payout_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payouts" ON public.payouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

This avoids the `shareasale_account_id` FK constraint on `transactions_cache`.

## Frontend Changes

### 1. `src/components/dashboard/QuickAddPayout.tsx` (new)
- Sheet component (slides from right, glass styling, dark theme)
- Three fields:
  - **Amount**: Large `$` prefixed input, `type="number"`, step 0.01, autofocus, required
  - **Brand/Source**: Combobox (Popover + Command) with searchable suggestions: Energybits, Ketone IQ, ShareASale, Impact, etc. Also accepts free-text
  - **Category**: Toggle group with two options — "Direct Brand" / "Network" — styled as pill buttons
- **Save** button: `variant="hero"`, full-width at bottom
- On save:
  1. Insert into `payouts` table via Supabase client
  2. Show success toast with amount + brand
  3. Close drawer
  4. Invalidate `dashboard-metrics` and `earnings-chart` query keys

### 2. `src/hooks/useDashboardMetrics.ts` (update)
- In `useDashboardMetrics`, also fetch from `payouts` table and merge totals into `totalRevenue`
- In `useEarningsChart`, also fetch from `payouts` (using `payout_date`) and merge into daily earnings
- Payouts always count as "paid" revenue (no pending status)

### 3. `src/pages/Dashboard.tsx` (update)
- Import `QuickAddPayout`
- Add `<QuickAddPayout />` in the header area next to the "Sync Now" button
- The component self-manages its open/close state

## Files

| File | Action |
|---|---|
| Migration | Create `payouts` table with RLS |
| `src/components/dashboard/QuickAddPayout.tsx` | New — Sheet with form |
| `src/hooks/useDashboardMetrics.ts` | Merge payouts into metrics + chart |
| `src/pages/Dashboard.tsx` | Add QuickAddPayout to header |

