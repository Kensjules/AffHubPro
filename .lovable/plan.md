
# Plan: Disable Mandatory ShareASale Connection Gates

## Problem Identified

The Dashboard and Transactions pages contain **component-level gates** that block access when ShareASale is not connected. These are NOT routing-level redirects, but rather conditional renders within the components themselves:

| File | Gate Location | Behavior |
|------|---------------|----------|
| `Dashboard.tsx` | Lines 42-58 | Shows "Connect ShareASale" modal instead of dashboard |
| `Transactions.tsx` | Lines 104-119 | Shows "Connect ShareASale" modal instead of transactions |
| `Settings.tsx` | None | Already accessible without ShareASale |

## Implementation

### Task 1: Bypass Dashboard Gate

**File:** `src/pages/Dashboard.tsx`

Comment out the ShareASale connection gate (lines 42-58) with a clear temporary marker:

```tsx
// TEMP: Disable onboarding redirect for debugging - remove after testing complete
// Gate: Require ShareASale connection
// if (!shareASaleAccount?.is_connected) {
//   return (
//     <div className="min-h-screen bg-background flex items-center justify-center">
//       ... connection prompt ...
//     </div>
//   );
// }
```

### Task 2: Bypass Transactions Gate

**File:** `src/pages/Transactions.tsx`

Comment out the ShareASale connection gate (lines 104-119) with the same temporary marker:

```tsx
// TEMP: Disable onboarding redirect for debugging - remove after testing complete
// if (!shareASaleAccount?.is_connected) {
//   return (
//     ... connection prompt ...
//   );
// }
```

## Changes Summary

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Comment out lines 42-58 (ShareASale gate) |
| `src/pages/Transactions.tsx` | Comment out lines 104-119 (ShareASale gate) |

## Technical Details

### Why Component-Level Gates, Not Routes?

The original design intended to:
1. Force users through onboarding before accessing the main app
2. Provide a clear path to connect ShareASale

With the new Integrations tab in Settings, users can now connect ShareASale from a more accessible location, making the forced gates unnecessary.

### Future Refactoring (Post-Testing)

Consider replacing the hard gates with a **soft notification banner**:
- Show a dismissible banner at the top of Dashboard/Transactions when ShareASale is not connected
- Link to Settings → Integrations tab to connect
- Allow full page functionality without blocking access

## Verification Steps

After implementation:
1. Log in as an authenticated user WITHOUT ShareASale connected
2. Navigate to `/dashboard` - verify full dashboard renders (may show empty data)
3. Navigate to `/transactions` - verify transactions table renders (may show empty)
4. Navigate to `/settings` → Integrations tab - verify connection cards appear
5. Confirm the "Connect ShareASale" dialog in Settings works correctly

## Cleanup Reminder

These changes are marked as **TEMP** and should be:
- Kept during the Awin/ShareASale integration testing phase
- Either removed (restoring original behavior) or replaced with soft notifications after testing is complete
