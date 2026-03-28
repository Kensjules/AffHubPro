

# Custom Brand Persistence for Quick-Add Payout

## Overview
Create a `custom_brands` table so user-added brands persist across sessions. Merge them with the hardcoded suggestions in the combobox dropdown. On save, if the typed brand is new, auto-insert it into `custom_brands`. The existing query invalidation already handles immediate dashboard metric updates.

## Database

### New `custom_brands` table (migration)
```sql
CREATE TABLE public.custom_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.custom_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands" ON public.custom_brands
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brands" ON public.custom_brands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own brands" ON public.custom_brands
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

## Frontend Changes

### `src/components/dashboard/QuickAddPayout.tsx`

1. **Fetch custom brands** — Use `useQuery` with key `["custom-brands"]` to load from `custom_brands` table on mount.

2. **Merge brand lists** — Combine hardcoded `BRAND_SUGGESTIONS` with fetched custom brands (deduplicated, case-insensitive).

3. **"Add new brand" option** — When the typed text doesn't match any existing brand (hardcoded or custom), show a `CommandItem` reading `Add "[typed text]" as a new brand` (replaces the current `CommandEmpty` button). On select:
   - Insert into `custom_brands` (case-insensitive duplicate check via the DB unique constraint; trim + limit to 100 chars)
   - Set `brandSource` to the new name
   - Invalidate `["custom-brands"]` query
   - Close popover

4. **On Save Payout** — Also upsert the brand into `custom_brands` if it doesn't exist yet (handles free-text "Use" entries). The existing `queryClient.invalidateQueries` for `dashboard-metrics` and `earnings-chart` already ensures immediate revenue card/chart updates.

5. **Input validation** — Brand names trimmed, max 100 chars, sanitized (no HTML). Case-insensitive duplicate prevention via `UNIQUE(user_id, lower(name))` or application-level lowercased check before insert.

## Files Modified

| File | Action |
|---|---|
| Migration | Create `custom_brands` table with RLS |
| `src/components/dashboard/QuickAddPayout.tsx` | Fetch + merge custom brands, add "Add new brand" UX, auto-save new brands on payout save |

