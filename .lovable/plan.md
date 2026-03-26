

# Improve Link Vault Onboarding Experience

## Changes

### 1. Clean Mock Data from Database
Run a data operation to delete mock/placeholder links (Amazon, Walmart, Best Buy, etc.) and their associated transaction data from the database for all users.

### 2. Enhanced Empty State in `src/components/dashboard/LinkVault.tsx`
Replace the current minimal empty state (lines 370-374) with a welcoming onboarding prompt that:
- Shows a friendly "Welcome! Let's get started" heading
- Encourages users to import links via Bulk Import or add one manually
- Includes the `BulkImportDialog` button directly in the empty state for maximum discoverability
- Uses existing design system components (Card, icons, etc.)

### 3. No Other Changes Needed
- The Bulk Import button is **already** on the Link Vault dashboard (line 265), not hidden in Settings
- The CSV template download is already accessible inside the BulkImportDialog
- No backend/parsing/Revenue Bodyguard changes required

## Technical Details

### Files modified
- `src/components/dashboard/LinkVault.tsx` — enhanced empty state UI only (lines 370-374)

### Database operation
- Delete rows from `affiliate_links` where `merchant_name` matches known mock entries (Amazon, Walmart, Best Buy, etc.)
- Delete orphaned rows from `transactions_cache` if applicable

