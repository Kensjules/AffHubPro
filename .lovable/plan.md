
# Plan: Fix Authentication Redirect Configuration

## Problem Diagnosis

The external ShareASale redirect on logout is **not caused by frontend code**. The codebase is already configured correctly:

- `App.tsx` has an `onAuthStateChange` listener that calls `window.location.replace("/")` on `SIGNED_OUT`
- `DashboardSidebar.tsx` logout handler calls `supabase.auth.signOut()` then `window.location.replace("/")`
- `AuthContext.tsx` uses `window.location.origin` for all email redirects

**Root cause:** The Supabase Auth backend has cached redirect URLs from the old staging domain (`trans-a-lyze.lovable.app`). When auth events occur, the backend may be issuing redirect instructions that conflict with the frontend logic.

## Solution

### Step 1: Update Supabase Auth Redirect URLs (Backend Configuration)

Use the Lovable Cloud configure-auth tool to explicitly set the allowed redirect URLs:

```
Primary Site URL: https://affhubpro.com

Additional Redirect URLs:
- https://affhubpro.com
- https://affhubpro.com/dashboard
- https://affhubpro.com/reset-password
```

This ensures that **only** `affhubpro.com` URLs are recognized by the auth system.

### Step 2: Verify Frontend Redirect Hardening

The current implementation already uses `window.location.origin` dynamically. However, for maximum resilience against any backend redirect instructions, the sign-out flow should:

1. Clear local Supabase state via `signOut()`
2. Immediately hard-redirect to `/` using `window.location.replace("/")`

This is already implemented correctly. No code changes needed here.

### Step 3: Set Primary Domain in Project Settings

For the production environment to strictly use `affhubpro.com`:
1. Navigate to Project Settings in Lovable
2. Under Domains, set `affhubpro.com` as the **Primary Domain**
3. This ensures all other domains (including the old `trans-a-lyze.lovable.app` staging URL) redirect to the primary

---

## Technical Details

### Files Reviewed (No Changes Required)

| File | Status |
|------|--------|
| `src/App.tsx` | Correct: `onAuthStateChange` listener handles `SIGNED_OUT` |
| `src/components/dashboard/DashboardSidebar.tsx` | Correct: Uses `window.location.replace("/")` |
| `src/contexts/AuthContext.tsx` | Correct: Uses `window.location.origin` for redirects |
| `src/components/ProtectedRoute.tsx` | Correct: Redirects to `/` when no user |
| `src/pages/Index.tsx` | Correct: Redirects authenticated users to `/dashboard` |

### Backend Configuration Required

The Supabase Auth Redirect URLs must be updated through the backend configuration interface. This is a settings change, not a code change.

### Why Code Changes Won't Fix This

The redirect to an external URL happens because:
1. The Supabase Auth backend has a cached Site URL or redirect list
2. During the sign-out process, the backend may issue a redirect instruction
3. Even though the frontend immediately redirects to `/`, the browser may race with the backend instruction

The only reliable fix is to update the backend configuration to use `affhubpro.com` as the sole allowed domain.

---

## Summary

- **No frontend code changes required** - the implementation is correct
- **Backend configuration change required** - update Supabase Auth redirect URLs
- **Domain settings change required** - set `affhubpro.com` as Primary Domain

After these configuration changes, clear your browser cache and test the logout flow in an incognito window to verify the fix.
