

# Bulk Import Links — Paste URLs Feature

## Overview
Add a "Bulk Import" button (outlined style) next to the existing "Add Link" button in the Link Health Monitor header. It opens a centered dialog with a large textarea where users paste one URL per line. On submit, URLs are trimmed, deduplicated against existing links, inserted into `affiliate_links`, and a toast confirms "Imported X links".

## Changes — Single file: `src/components/dashboard/BrokenLinkScanner.tsx`

### UI Trigger (line 126-128 area)
Add a new outlined button between "Add Link" and "Scan Now":
```tsx
<Button variant="outline" size="sm">
  <Upload className="w-4 h-4" />
  Bulk Import
</Button>
```

### Import Dialog
- Centered `Dialog` with a `Textarea` (min 8 rows) and placeholder: "Paste one URL per line…"
- Submit button labeled "Import Links", disabled while empty or processing
- State: `showBulkDialog`, `bulkUrls` (string), `bulkImporting` (boolean)

### Processing Logic (on submit)
1. Split textarea by newlines, trim whitespace, filter empty lines
2. Validate each line is a valid HTTP/HTTPS URL — skip invalid ones
3. Fetch existing `affiliate_links` URLs for the user, normalize for dedup (lowercase hostname, strip trailing slash)
4. Filter out duplicates (against DB and within the batch)
5. Insert valid, unique URLs into `affiliate_links` with `network: "other"`, `status: "active"`
6. Invalidate `affiliate-links`, `link-stats`, `broken-links` queries so Active count updates immediately
7. Show toast: `"Imported X links"` (or `"No new links to import"` if all were duplicates/invalid)
8. Close dialog, reset state

### No database or edge function changes needed
The `affiliate_links` table already supports inserts with RLS. The existing `useAddAffiliateLink` pattern is followed but we do a direct batch insert for efficiency.

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/BrokenLinkScanner.tsx` | Add Bulk Import button, dialog with textarea, processing logic |

