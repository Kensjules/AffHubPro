

# Brand Management Enhancement

## Overview
Three changes: add helper text under the Brand/Source label, add delete icons for custom brands in the dropdown, and update the How It Works landing section.

## 1. QuickAddPayout.tsx Changes

### Helper text (line 206-207)
Add beneath the "Brand / Source" label:
```tsx
<p className="text-muted-foreground/70 text-xs">Type to search or add a custom brand.</p>
```

### Fetch custom brands with IDs
Change the query (lines 55-67) to select `id, name` instead of just `name`, returning `{ id: string, name: string }[]` so we can delete by ID.

### Track which brands are custom
Create a `Set` of custom brand names (lowercase) so we can show trash icons only next to custom brands in the dropdown list.

### Delete handler
Add `handleDeleteBrand(id, name)`:
1. Show a confirmation toast with a "Confirm" action button using the existing toast system
2. On confirm: `supabase.from("custom_brands").delete().eq("id", id)`
3. Invalidate `["custom-brands"]` query
4. If `brandSource` matches the deleted brand, clear it

### Trash icon in dropdown (lines 227-237)
For each brand in `filteredBrands`, if it's a custom brand (in the custom set), render a `Trash2` icon on the right side of the `CommandItem`. The icon click calls `handleDeleteBrand` with `e.stopPropagation()` to prevent selecting the brand.

## 2. HowItWorksSection.tsx Change

### Step 02 description (line 14)
Append the required text to Step 02's description:
```
"Connect a network via API or import any affiliate data with CSV. We support ShareASale, Awin, Impact, and direct brand exports. Full Control: Add or remove custom affiliate partners in seconds."
```

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/QuickAddPayout.tsx` | Helper text, fetch brand IDs, trash icon + delete with confirm toast |
| `src/components/landing/HowItWorksSection.tsx` | Add "Full Control" text to Step 02 |

