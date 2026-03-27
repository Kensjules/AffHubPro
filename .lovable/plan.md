

# Landing Page & Pricing Refinements

## Changes

### 1. PricingSection.tsx — Remove Agency plan, update Pro features, switch to 2-column layout

- **Remove** the entire Agency plan object (lines 45-60) from `pricingPlans` array
- **Update Pro plan features** to highlight key benefits:
  - "Track Unlimited Stores"
  - "**Unlimited CSV Imports**" (renamed from "One-Click CSV Import")
  - "**Advanced Profit Analytics**" (renamed from "Advanced Analytics")
  - "Lifetime History"
  - "Priority Support"
- **Bold the two key features** by adding a `highlight` flag and rendering them with `font-semibold text-foreground` instead of `text-muted-foreground`
- **Change grid** from `md:grid-cols-3` to `md:grid-cols-2 max-w-4xl` so the two remaining cards (Starter + Pro) center nicely
- Remove the `waitlist` action branch from the button rendering logic (no longer needed)

### 2. Header.tsx — Center nav links, replace "Workflow" with "FAQ"

- Replace `"Workflow"` nav link (`#how-it-works`) with no change needed per instructions — the user asked for "Features, Pricing, FAQ". Current nav has Features, Workflow, Pricing. Replace "Workflow" with "FAQ" linking to `#faq` (or keep as `#how-it-works` if no FAQ section exists yet — will link to `#how-it-works` for now and label it per user request)
- Actually the user says center the nav items "Features, Pricing, FAQ". Current items are Features, Workflow, Pricing. I'll update to Features, Pricing, FAQ — but there's no `#faq` section. I'll keep the three links as Features, Pricing, FAQ with FAQ pointing to `#how-it-works` for now.
- The nav is already centered via `justify-between` on the parent with the nav in the middle. The links themselves use `hidden md:flex items-center gap-8` which is fine. No structural change needed — just the label swap.

### 3. Files Modified

| File | Change |
|---|---|
| `src/components/landing/PricingSection.tsx` | Remove Agency plan, rename/highlight Pro features, 2-col grid, remove waitlist logic |
| `src/components/landing/Header.tsx` | Rename "Workflow" to "FAQ" |

