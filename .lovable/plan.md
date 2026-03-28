

# Link Health Monitor Enhancement — Tabbed Import, Brand Sync, Live Table

## Overview
Merge the two separate import dialogs (BulkPasteImportDialog + BulkImportDialog) into a single tabbed dialog, add XLSX support, extract brand names from imports into `custom_brands`, add a live results table with green/red/yellow status badges, and implement URL auto-protocol prepending.

## 1. New Unified Import Dialog

**File: `src/components/dashboard/UnifiedImportDialog.tsx`** (new)

A single Dialog with two Tabs: "Paste Links" and "Upload CSV/Excel".

- **Paste Links tab**: Large textarea (existing logic from BulkPasteImportDialog)
- **Upload CSV/Excel tab**: Drag-and-drop zone accepting `.csv` and `.xlsx` files. CSV parsed with PapaParse (already installed). XLSX parsed with the `xlsx` library (needs install). Both look for columns named `url`/`affiliate_url` and `brand`/`affiliate brand name`/`merchant_name`.

**URL Sanitization** (shared across both tabs):
- Trim whitespace
- Auto-prepend `https://` if no protocol present
- Validate as HTTP/HTTPS URL
- Batch limit: 1,000 links per operation

**Brand Extraction & Sync**:
- For CSV/XLSX: extract brand from `merchant_name`/`brand`/`affiliate brand name` column
- For paste mode: extract domain name as brand (e.g., `amazon.com` → `Amazon`)
- After import, batch-insert unique new brands into `custom_brands` (skip existing, case-insensitive dedup)
- Invalidate `custom-brands` query so Quick-Add Payout sees them immediately

**Toast**: `"Imported X links and updated your Brand list!"`

## 2. Live Results Table

**Added to: `src/components/dashboard/BrokenLinkScanner.tsx`**

Below the existing stats bar, add a collapsible table showing all affiliate links with columns:
- **Brand/Link**: merchant_name + truncated URL
- **Status**: Badge with smart color logic
- **Last Checked**: relative timestamp

**Smart Status Logic**:
- Green "Active" badge: HTTP 200
- Red "Broken" badge: HTTP 404 or network failure (status 0)
- Yellow "Warning" badge: HTTP 401/403 with tooltip "Site blocked automated ping; please verify manually."

This uses the existing `useAffiliateLinks` hook to fetch all links.

## 3. Warning Status Support

**File: `src/hooks/useAffiliateLinks.ts`**
- Add `"warning"` to the `AffiliateLink.status` type and `LinkStats` interface

**File: `supabase/functions/scan-affiliate-links/index.ts`**
- When HTTP 401/403 is returned, set status to `"warning"` instead of `"broken"`

**Database**: No schema change needed — `status` is a `text` column, so `"warning"` works without migration.

## 4. Integration Updates

**File: `src/components/dashboard/BrokenLinkScanner.tsx`**
- Replace `<BulkPasteImportDialog />` with `<UnifiedImportDialog />`
- Add the live results table section

**File: `src/components/dashboard/LinkVault.tsx`**
- Replace `<BulkImportDialog />` with `<UnifiedImportDialog />`

**File: `src/components/dashboard/BulkPasteImportDialog.tsx`** — remove (replaced)
**File: `src/components/dashboard/BulkImportDialog.tsx`** — remove (replaced)

## 5. Package Addition
- Install `xlsx` package for Excel file parsing

## Technical Details

### Brand extraction from domain (paste mode)
```typescript
function extractBrandFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const brand = hostname.split(".")[0];
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch { return null; }
}
```

### Brand sync logic
```typescript
// After import, collect unique brand names
const newBrands = uniqueBrandNames.filter(
  name => !existingBrands.has(name.toLowerCase())
);
if (newBrands.length > 0) {
  await supabase.from("custom_brands").insert(
    newBrands.map(name => ({ user_id: user.id, name }))
  );
  queryClient.invalidateQueries({ queryKey: ["custom-brands"] });
}
```

### Protected system brands
`BRAND_SUGGESTIONS` array (ShareASale, Impact, etc.) is hardcoded and never deleted — only custom brands can be removed. The sync logic skips brands that already exist (case-insensitive).

## Files Modified

| File | Action |
|---|---|
| `src/components/dashboard/UnifiedImportDialog.tsx` | New — tabbed import with paste + file upload |
| `src/components/dashboard/BrokenLinkScanner.tsx` | Swap import dialog, add live results table |
| `src/components/dashboard/LinkVault.tsx` | Swap import dialog reference |
| `src/hooks/useAffiliateLinks.ts` | Add warning status to types and stats |
| `supabase/functions/scan-affiliate-links/index.ts` | Set warning status for 401/403 |
| `src/components/dashboard/BulkPasteImportDialog.tsx` | Remove |
| `src/components/dashboard/BulkImportDialog.tsx` | Remove |
| `package.json` | Add `xlsx` dependency |

