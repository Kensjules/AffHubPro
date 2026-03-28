

# Integration Enhancements — Awin Test Connection, Help Text & ClickBank Placeholder

## Overview
Most of the integration infrastructure is already built and working. This plan addresses the specific gaps between what exists and what was requested.

## Gap Analysis

| Feature | Status | Action Needed |
|---|---|---|
| Awin dialog with Publisher ID + Token | Done | Add help text, add Test Connection button |
| Awin edge functions (store + sync) | Done | Add test-only mode to `store-awin-credentials` |
| ClickBank dialog with 3 fields | Done | Add Developer Key placeholder value |
| ClickBank edge functions (store + sync) | Done | No changes needed |
| ClickBank Test Connection | Done | No changes needed |
| Automated hourly cron sync | Missing | Add `pg_cron` + `pg_net` scheduled job |

## Changes

### 1. `src/components/integrations/AwinConnectDialog.tsx`
- Add help text block: *"Connecting your Awin/ShareASale account automatically imports sales data for all your joined merchants (like ENERGYbits, Ketone IQ, etc.). You only need to provide your API Token once—we'll handle the individual store tracking for you!"*
- Add a "Test Connection" button (same pattern as ClickBank dialog) with inline success/error badge
- Add `onTestConnection` prop to the interface
- Import `HelpCircle`, `CheckCircle2`, `XCircle`, `Badge`, `Tooltip` components

### 2. `supabase/functions/store-awin-credentials/index.ts`
- Add `testOnly` flag support (mirror ClickBank pattern)
- When `testOnly: true`, call Awin Publisher API with provided credentials to validate, return success/error without storing
- Test endpoint: `https://api.awin.com/publishers/{publisherId}/accounts` with `Authorization: Bearer {apiToken}`

### 3. `src/hooks/useAwinIntegration.ts`
- Add `testConnection(publisherId, apiToken)` method that invokes `store-awin-credentials` with `testOnly: true`
- Return `testConnection` from the hook

### 4. `src/pages/Integrations.tsx`
- Pass `onTestConnection` prop to `AwinConnectDialog`

### 5. `src/components/integrations/ClickBankConnectDialog.tsx`
- Set Developer Key `placeholder` to: `Captain Key (DEV-123456789012345678901234567890123456)`

### 6. Database — Hourly Cron Sync (via SQL insert, not migration)
Enable `pg_cron` and `pg_net` extensions, then schedule two hourly jobs:
- One for `sync-shareasale` (iterates all connected ShareASale accounts)
- One for `sync-clickbank` (iterates all connected ClickBank accounts)

Both jobs call the respective edge functions. Since edge functions currently require a user JWT, we'll create a new `sync-all-accounts` edge function that uses the service role key to iterate all connected integrations and sync each one.

### 7. `supabase/functions/sync-all-accounts/index.ts` — New
- Invoked by cron (no JWT required, validates via a shared secret or service role)
- Queries all `user_integrations` where `is_connected = true`
- For each integration, fetches credentials and calls the appropriate API (Awin or ClickBank)
- Upserts transactions into `transactions_cache` with idempotency via `transaction_id` unique constraint
- Updates `last_sync_at` per integration

## Files Modified

| File | Change |
|---|---|
| `src/components/integrations/AwinConnectDialog.tsx` | Add help text, Test Connection button with feedback badge |
| `src/hooks/useAwinIntegration.ts` | Add `testConnection` method |
| `supabase/functions/store-awin-credentials/index.ts` | Add `testOnly` mode with Awin API validation |
| `src/pages/Integrations.tsx` | Pass `onTestConnection` to Awin dialog |
| `src/components/integrations/ClickBankConnectDialog.tsx` | Update Developer Key placeholder text |
| `supabase/functions/sync-all-accounts/index.ts` | New — cron-triggered bulk sync for all users |
| `supabase/config.toml` | Add `sync-all-accounts` function entry |
| SQL insert (not migration) | Enable `pg_cron`/`pg_net`, schedule hourly job |

