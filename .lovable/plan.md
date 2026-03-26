

# Bulk CSV Import for Link Vault

## Overview
Add a client-side CSV import feature to LinkVault with a template download, duplicate detection, validation, and auto-scan triggering for new links.

## Architecture Decision
**Client-side CSV parsing** (no new edge function needed). The CSV is parsed in the browser using a lightweight parser, validated, deduped against existing links fetched from the DB, then inserted via the existing Supabase client. After insert, each new link is scanned via the existing `scan-link` edge function.

## Changes

### 1. New Component: `src/components/dashboard/BulkImportDialog.tsx`
- Dialog triggered by a "Bulk Import" button placed next to the existing "Add Link" button in LinkVault
- File input accepting `.csv` only
- Client-side CSV parsing (use `papaparse` library — lightweight, handles edge cases)
- Validation: required `affiliate_url` column, well-formed URL check
- Duplicate detection: normalize URLs (lowercase, trim trailing slashes), compare against user's existing links
- Progress indicator during processing
- Success report: "X imported, Y duplicates skipped, Z invalid rows"
- "Download Template" link that generates a CSV blob with headers + example rows

### 2. Modify: `src/components/dashboard/LinkVault.tsx`
- Add "Bulk Import" button in the section header area
- Import and render `BulkImportDialog`
- On successful import, invalidate queries to refresh the table

### 3. Add dependency: `papaparse` + `@types/papaparse`

### 4. CSV Template (generated in-browser)
```
affiliate_url,merchant_name,network,campaign
https://www.shareasale.com/r.cfm?b=123&u=456,Example Merchant,ShareASale,Spring Campaign
https://www.awin1.com/cread.php?awinmid=789,Another Merchant,Awin,
```

## Processing Flow

```text
User clicks "Bulk Import" → selects CSV file
  ↓
Parse CSV with PapaParse (client-side)
  ↓
Validate headers (affiliate_url required)
  ↓
For each row:
  - Validate URL format
  - Normalize URL (trim, lowercase host, remove trailing slash)
  - Check against existing user links (pre-fetched)
  - Categorize: valid-new / duplicate / invalid
  ↓
Batch insert valid-new rows into affiliate_links table
  ↓
Show success report (imported / skipped / invalid counts)
  ↓
Fire scan-link for each new link (throttled, non-blocking)
```

## Key Technical Details

- **Duplicate detection**: Fetch all user's existing link URLs before processing. Normalize both CSV URLs and existing URLs for comparison (lowercase hostname, strip trailing slash, trim whitespace).
- **Batch insert**: Use Supabase `.insert([...rows])` for a single batch operation (up to 500 rows).
- **Auto-scan**: After insert, iterate through new links and call `scan-link` edge function with a small delay between calls (e.g., 200ms) to avoid overwhelming the function. This runs in the background — user sees the import report immediately.
- **Security**: File type validation, URL format validation, input sanitization (trim, length limits on merchant_name/campaign to 200 chars), max 500 rows enforced client-side.
- **Error handling**: Malformed CSV → specific error message. Missing `affiliate_url` header → error. Empty file → error. Over 500 rows → warning with truncation.

### Files modified
- `src/components/dashboard/LinkVault.tsx` — add Bulk Import button
- `src/components/dashboard/BulkImportDialog.tsx` — new file, full import logic + UI
- `package.json` — add `papaparse` dependency

### Files NOT modified
- No database schema changes (existing `affiliate_links` table has all needed columns)
- No new edge functions needed
- No changes to `scan-link` or `send-email`

