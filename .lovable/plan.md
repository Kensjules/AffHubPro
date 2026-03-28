

# Link Health Monitor — 3-Second Progress Bar Enhancement

## Overview
The Link Health Monitor already works end-to-end: the "Scan Now" button calls the `scan-affiliate-links` edge function, which performs HEAD requests and updates statuses. The active/broken counts are already dynamic from the database. The missing piece is a **3-second animated progress bar** during scanning to give a premium feel.

## Changes

### `src/components/dashboard/BrokenLinkScanner.tsx`

1. **Add progress bar state** — Track `scanProgress` (0-100) and `isAnimating` boolean.
2. **On "Scan Now" click**:
   - Set `isAnimating = true`, start a 3-second interval that increments `scanProgress` from 0 to ~95 over 3 seconds (e.g., tick every 100ms, increment by ~3.3).
   - Fire `scanLinks()` mutation simultaneously.
   - When the mutation completes (success or error), jump progress to 100, wait 300ms, then hide the bar.
3. **Render a `<Progress />` component** (already exists in `src/components/ui/progress.tsx`) between the stats row and the broken links list, visible only when `isAnimating` is true.
4. **Disable "Scan Now" button** while `isAnimating` is true (not just while `scanning`).
5. **Show scan result summary** — After scan completes, display a brief toast with "X links scanned, Y broken found" (already done via `useScanLinks` `onSuccess`).

### No database or edge function changes needed
- The `affiliate_links` table already has `status`, `last_checked_at`, `http_status_code` fields.
- The edge function already performs HEAD requests with 10s timeout and updates statuses.
- The `useLinkStats` hook already counts active/broken/ignored from the database dynamically.
- The `useBrokenLinks` hook already fetches broken links for display.

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/BrokenLinkScanner.tsx` | Add progress bar animation during scan, import `Progress` component |

