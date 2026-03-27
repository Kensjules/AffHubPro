

# First-Name Greeting Update

## Summary
Extract only the first name from `display_name` for greetings on Dashboard and Subscription Success pages.

## Helper Logic (inline, no new file)
```ts
const firstName = (profile?.display_name?.split(" ")[0]) || user?.email?.split("@")[0] || "User";
```
This handles: full name → first word; single name → that name; no name → email prefix; no email → "User".

## Changes

### 1. `src/pages/Dashboard.tsx` (line 41)
**Current:** `const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";`
**New:** `const displayName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";`

The greeting on line ~56 already reads `Welcome back, {displayName}` — no change needed there.

### 2. `src/pages/SubscriptionSuccess.tsx` (lines 1-33)
- Import `useAuth` and `useProfile`
- Derive `firstName` using the same `.split(" ")[0]` logic
- Change heading from `"Welcome to Pro!"` to `"Welcome to Pro, {firstName}!"`

### 3. `src/components/dashboard/DashboardSidebar.tsx` (line ~93)
The sidebar also shows `displayName` in the user profile section. This should remain the **full** display name (not first-name-only) since it's an identity label, not a greeting. **No change needed.**

## Test Scenarios
| display_name | email | Dashboard greeting | Success heading |
|---|---|---|---|
| `"Jane Smith"` | `jane@x.com` | Welcome back, Jane | Welcome to Pro, Jane! |
| `"Jane"` | `jane@x.com` | Welcome back, Jane | Welcome to Pro, Jane! |
| `null` | `jane@x.com` | Welcome back, jane | Welcome to Pro, jane! |
| `null` | `null` | Welcome back, User | Welcome to Pro, User! |

## Files Modified
- `src/pages/Dashboard.tsx` — 1 line change (line 41)
- `src/pages/SubscriptionSuccess.tsx` — add imports + firstName logic + update heading text

