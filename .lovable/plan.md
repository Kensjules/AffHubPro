

# Link Deletion — Individual & Bulk Broken

## Overview
Add a trash icon to each row in the live results table and a "Clear Broken Links" button in the header. Both use confirmation before deleting, then invalidate queries so counts update instantly.

## 1. `src/hooks/useAffiliateLinks.ts` — Add bulk delete hook

Add `useClearBrokenLinks` mutation:
- Deletes all links where `status = 'broken'` and `user_id = auth.uid()`
- Uses `supabase.from("affiliate_links").delete().eq("user_id", user.id).eq("status", "broken")`
- Invalidates `affiliate-links`, `broken-links`, `link-stats` queries
- Toast: `"Cleared X broken links"`

No new endpoint needed — RLS already allows users to delete their own links.

## 2. `src/components/dashboard/BrokenLinkScanner.tsx`

### Header — "Clear Broken Links" button (next to Scan Now)
- Destructive outlined button: `variant="outline"` with `text-destructive` styling
- Only visible when `stats?.broken > 0`
- On click: show confirmation via `AlertDialog` (not toast — destructive bulk action warrants a modal)
- On confirm: call `useClearBrokenLinks` mutation

### Live Results Table — Actions column
- Add `<TableHead>Actions</TableHead>` as last column header
- In `LiveTableRow`, add a `<TableCell>` with a `Trash2` icon button (`variant="ghost"`, `size="icon"`)
- On click: show confirmation toast with destructive "Delete" action button (using existing `useDeleteLink` hook)
- After delete succeeds, queries auto-invalidate

### Import changes
- Import `Trash2` from lucide-react
- Import `useDeleteLink` from hooks (already exported)
- Import `AlertDialog` components from ui
- Add `useClearBrokenLinks` from hooks
- Pass `onDelete` callback to `LiveTableRow`

## Files Modified

| File | Change |
|---|---|
| `src/hooks/useAffiliateLinks.ts` | Add `useClearBrokenLinks` hook |
| `src/components/dashboard/BrokenLinkScanner.tsx` | Add Actions column with trash icon, "Clear Broken Links" button with AlertDialog |

