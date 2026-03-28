

# Add Placeholder Integration Cards

## Overview
Add three "Coming Soon" integration cards (ClickBank, Impact, Amazon Associates) to the Integrations page grid. Each card uses the same `glass rounded-xl` styling as the Awin card, with a "Coming Soon" badge and a "Notify Me" button that triggers a toast.

## Changes — Single file: `src/pages/Integrations.tsx`

### Add import
- Add `Bell` from lucide-react (for Notify Me button icon)
- Add `toast` from `sonner`

### Add placeholder cards after the Awin card (after line 185, inside the grid div)

Three cards, each with this structure:
```
glass rounded-xl p-6 space-y-4 opacity-80
```

Each card contains:
1. **Header**: Brand name text (styled like AwinLogo area) + "Coming Soon" badge (`variant="outline"` with amber/yellow styling)
2. **Title & Description**: Network name as `<h3>`, provided label as `<p>`
3. **Footer**: "Notify Me" button (`variant="outline"`, `size="sm"`) with `Bell` icon — on click calls `toast.success("We'll notify you when [Network] is available!")`

Card data:
| Network | Label |
|---|---|
| ClickBank | Popular for health, fitness, and digital products |
| Impact | Connect with brands like Nike, Adidas, and more |
| Amazon Associates | Track your Amazon referral commissions |

### Brand text styling
Since there are no official SVG logos to use, render each network name as bold text in the logo area (`p-2 rounded-lg bg-card/50` container, matching Awin logo placement) with a distinct brand color per network:
- ClickBank: `#2ECC71` (green)
- Impact: `#6366F1` (indigo)
- Amazon Associates: `#FF9900` (orange)

## Files Modified

| File | Change |
|---|---|
| `src/pages/Integrations.tsx` | Add 3 Coming Soon placeholder cards with Notify Me toast |

