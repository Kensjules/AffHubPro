

# Enhance "Add as New Brand" Button in Quick-Add Payout

## Overview
Restyle the "Add as new brand" CommandItem from a subtle list item into a visually prominent gold button, and ensure it auto-selects the brand after saving.

## Change — Single file: `src/components/dashboard/QuickAddPayout.tsx`

### Visual (lines 239-248)
Replace the current `CommandItem` with a styled version using the brand gold color:

```tsx
{brandSource.trim().length > 0 && !exactMatch && (
  <CommandItem
    value={`__add__${brandSource.trim()}`}
    onSelect={handleAddNewBrand}
    className="mx-2 my-1 rounded-lg bg-primary/15 border border-primary/30 text-primary font-semibold hover:bg-primary/25 transition-colors"
  >
    <Plus className="w-4 h-4 mr-2" />
    Add &ldquo;{brandSource.trim().slice(0, 100)}&rdquo; as a new brand
  </CommandItem>
)}
```

This uses `bg-primary/15` with `border-primary/30` and `text-primary` — the gold color from the design system (`--primary: 45 93% 47%`). This gives it a distinct "button-like" appearance with gold tint, border, and bold text while remaining inside the Command list.

### Functional — `handleAddNewBrand` already works correctly
The existing `handleAddNewBrand` (lines 104-112) already:
1. Inserts into `custom_brands` table
2. Sets `setBrandSource(trimmed)` — auto-selects the brand
3. Closes the popover via `setBrandOpen(false)`

No functional changes needed — it already auto-selects and closes. The popover (not the Sheet drawer) closes, returning focus to the payout form with the brand pre-filled. This is the correct UX — the Sheet should stay open so the user can complete and save the payout.

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/QuickAddPayout.tsx` | Restyle "Add as new brand" CommandItem with gold background, border, bold text |

