

# ClickBank Integration — Full Connect Flow

## Overview
Transform the ClickBank "Coming Soon" card into a fully functional integration. This involves: a connect dialog with Nickname, Clerk API Key, and Developer Key fields; a "Test Connection" button; a backend edge function to validate and store credentials; and a sync edge function to fetch ClickBank orders into `transactions_cache`.

## Architecture

The integration follows the exact same pattern as the existing Awin integration:
- **Dialog component** (`ClickBankConnectDialog`) modeled after `AwinConnectDialog`
- **Hook** (`useClickBankIntegration`) modeled after `useAwinIntegration`
- **Edge functions**: `store-clickbank-credentials` (validate + store) and `sync-clickbank` (fetch orders)
- **Storage**: Reuses the existing `user_integrations` table with `integration_type = 'clickbank'`, plus a `nickname` column addition

ClickBank uses two keys: a **Clerk API Key** and a **Developer API Key**. These map to `api_token_encrypted` and `api_secret_encrypted` in `user_integrations`. The nickname requires adding a `nickname` column.

## Changes

### 1. Database Migration — Add `nickname` column
```sql
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS nickname text;
```
This supports labeling connections (e.g., "My Main Account").

### 2. `src/components/integrations/ClickBankConnectDialog.tsx` — New file
Dialog with three fields:
- **Nickname** — text input, required, max 100 chars
- **Clerk API Key** — password input with eye toggle, help tooltip linking to ClickBank Settings → Account Settings → Clerk API Keys
- **Developer API Key** — password input with eye toggle, help tooltip linking to ClickBank Settings → Account Settings → Developer API Keys
- **Test Connection** button — calls `store-clickbank-credentials` with `testOnly: true` flag, shows inline success/error badge
- **Connect** button — calls the hook's `saveIntegration` method

Follows `AwinConnectDialog` patterns: form validation, error states, loading spinners, disabled states during save.

### 3. `src/hooks/useClickBankIntegration.ts` — New file
Mirrors `useAwinIntegration`:
- Fetches from `user_integrations` where `integration_type = 'clickbank'`
- `saveIntegration(nickname, clerkApiKey, devApiKey)` → invokes `store-clickbank-credentials`
- `testConnection(clerkApiKey, devApiKey)` → invokes `store-clickbank-credentials` with `testOnly: true`
- `syncNow()` → invokes `sync-clickbank`
- `disconnectIntegration()` → sets `is_connected = false`

### 4. `supabase/functions/store-clickbank-credentials/index.ts` — New edge function
- Validates JWT via `getClaims()`
- Input validation: nickname (1-100 chars), clerkApiKey (10-500 chars), devApiKey (10-500 chars)
- If `testOnly` flag is set: makes a test GET request to `https://api.clickbank.com/rest/1.3/orders/list` with auth headers (`Authorization: DEV_KEY:CLERK_KEY`) to verify credentials, returns success/error without storing
- If not `testOnly`: upserts into `user_integrations` with `integration_type = 'clickbank'`, storing keys in `api_token_encrypted` / `api_secret_encrypted` and nickname
- Uses service role key for DB writes

### 5. `supabase/functions/sync-clickbank/index.ts` — New edge function
- Validates JWT, retrieves user's ClickBank credentials from `user_integrations`
- Calls ClickBank Orders API: `GET https://api.clickbank.com/rest/1.3/orders/list?startDate=...&endDate=...`
- Auth header format: `Authorization: DEV_KEY:CLERK_KEY`
- Parses XML/JSON response, extracts transactions
- Upserts into `transactions_cache` using ClickBank receipt as `transaction_id` for idempotency
- Updates `last_sync_at` on the integration record
- Extracts merchant/vendor names into `custom_brands` for the Quick-Add Payout dropdown

### 6. `src/pages/Integrations.tsx` — Update ClickBank card
Replace the "Coming Soon" card with an active integration card (same pattern as Awin card):
- When not connected: clickable card opens `ClickBankConnectDialog`
- When connected: shows nickname, last sync time, Settings and Sync Now buttons
- Remove `opacity-80` and "Coming Soon" badge
- Import and use the new hook and dialog

### 7. `supabase/config.toml` — Add function configs
```toml
[functions.store-clickbank-credentials]
verify_jwt = false

[functions.sync-clickbank]
verify_jwt = false
```

## Security
- Credentials stored encrypted via service role (same pattern as Awin)
- JWT validated in-code via `getClaims()` before any operation
- RLS on `user_integrations` scopes all queries to `auth.uid() = user_id`
- Keys transmitted only over HTTPS, never exposed client-side after storage
- Test connection validates without persisting credentials

## Files Modified

| File | Change |
|---|---|
| Migration | Add `nickname` column to `user_integrations` |
| `src/components/integrations/ClickBankConnectDialog.tsx` | New — connect dialog with 3 fields + test button |
| `src/hooks/useClickBankIntegration.ts` | New — hook for ClickBank CRUD + sync |
| `supabase/functions/store-clickbank-credentials/index.ts` | New — validate + store credentials |
| `supabase/functions/sync-clickbank/index.ts` | New — fetch orders + upsert transactions |
| `src/pages/Integrations.tsx` | Transform ClickBank card from placeholder to active |
| `supabase/config.toml` | Add function entries |

