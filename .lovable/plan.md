
# Plan: Fix Authentication Redirect Configuration

## ✅ Status: APPROVED - Manual Configuration Required

## Problem Diagnosis

The external ShareASale redirect on logout is **not caused by frontend code**. The codebase is already configured correctly:

- `App.tsx` has an `onAuthStateChange` listener that calls `window.location.replace("/")` on `SIGNED_OUT`
- `DashboardSidebar.tsx` logout handler calls `supabase.auth.signOut()` then `window.location.replace("/")`
- `AuthContext.tsx` uses `window.location.origin` for all email redirects

**Root cause:** The Supabase Auth backend has cached redirect URLs from the old staging domain (`trans-a-lyze.lovable.app`). When auth events occur, the backend may be issuing redirect instructions that conflict with the frontend logic.

## Solution - Manual Steps Required

### Step 1: Set Primary Domain in Lovable Project Settings

1. Go to **Project Settings** → **Domains**
2. Find `affhubpro.com` in your domain list
3. Click the **three-dot menu** next to it and select **"Set as Primary"**
4. This forces all traffic from `trans-a-lyze.lovable.app` to redirect to `affhubpro.com`

### Step 2: Clear Browser Cache and Test

1. Clear your browser cache or open an **incognito window**
2. Navigate to `https://affhubpro.com`
3. Log in to the dashboard
4. Click **Sign Out**
5. Verify you land on `https://affhubpro.com/` with no external redirect

---

## Technical Details

### Files Reviewed (No Changes Required)

| File | Status |
|------|--------|
| `src/App.tsx` | ✅ Correct: `onAuthStateChange` listener handles `SIGNED_OUT` |
| `src/components/dashboard/DashboardSidebar.tsx` | ✅ Correct: Uses `window.location.replace("/")` |
| `src/contexts/AuthContext.tsx` | ✅ Correct: Uses `window.location.origin` for redirects |
| `src/components/ProtectedRoute.tsx` | ✅ Correct: Redirects to `/` when no user |
| `src/pages/Index.tsx` | ✅ Correct: Redirects authenticated users to `/dashboard` |

### Why Code Changes Won't Fix This

The redirect to an external URL happens because:
1. The Supabase Auth backend has a cached Site URL or redirect list
2. During the sign-out process, the backend may issue a redirect instruction
3. Even though the frontend immediately redirects to `/`, the browser may race with the backend instruction

The only reliable fix is to set `affhubpro.com` as the **Primary Domain** so all other domains redirect to it.

---

## Summary

- ✅ **No frontend code changes required** - the implementation is correct
- ⏳ **Domain settings change required** - set `affhubpro.com` as Primary Domain (manual step)
- ⏳ **Test in incognito** - verify the fix after setting Primary Domain
