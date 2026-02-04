

# Plan: Onboarding Flow Removal & Data Hub Activation

## Overview

This plan implements an immediate structural override to:
1. Eliminate all onboarding redirections
2. Delete the Onboarding.tsx component
3. Set Data Hub as the default Settings tab
4. Fix CORS configuration for the custom domain `affhubpro.com`

---

## Part 1: Eliminate Onboarding Redirection

### Files to Modify

**File: `src/App.tsx`**

| Line | Current | Action |
|------|---------|--------|
| 14 | `import Onboarding from "./pages/Onboarding";` | DELETE line |
| 62 | `<Route path="/onboarding" element={...}>` | DELETE line |

Result: The `/onboarding` route will no longer exist. Any navigation attempts to `/onboarding` will hit the NotFound page.

---

**File: `src/pages/Signup.tsx`**

| Line | Current | Change To |
|------|---------|-----------|
| 36 | `navigate("/onboarding");` | `navigate("/dashboard");` |
| 73-74 | Toast message + navigate to `/onboarding` | Update toast + navigate to `/dashboard` |

**Before (Line 73-74):**
```tsx
toast.success("Account created! Let's connect your ShareASale account.");
navigate("/onboarding");
```

**After:**
```tsx
toast.success("Account created! Welcome to AffHubPro.");
navigate("/dashboard");
```

---

## Part 2: Delete Onboarding Component

**File to DELETE: `src/pages/Onboarding.tsx`**

This file will be completely removed from the codebase. Since we're removing the import and route in App.tsx, there will be no dangling references.

---

## Part 3: Default Data Hub Activation

**File: `src/pages/Settings.tsx`**

| Line | Current | Change To |
|------|---------|-----------|
| 62 | `const [activeTab, setActiveTab] = useState<Tab>("account");` | `const [activeTab, setActiveTab] = useState<Tab>("datahub");` |

This ensures authenticated users landing on `/settings` immediately see the Data Hub tab with live revenue metrics.

---

## Part 4: Fix CORS for Custom Domain

**File: `supabase/functions/_shared/cors.ts`**

**Current `allowedOrigins` (Lines 6-15):**
```typescript
const allowedOrigins = [
  "https://id-preview--77fd7ca0-a1c1-4217-8651-093413cd8088.lovable.app",
  Deno.env.get("SUPABASE_URL") || "",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);
```

**Updated `allowedOrigins`:**
```typescript
const allowedOrigins = [
  // Production custom domain
  "https://affhubpro.com",
  "https://www.affhubpro.com",
  // Lovable preview URLs
  "https://id-preview--77fd7ca0-a1c1-4217-8651-093413cd8088.lovable.app",
  // Supabase URL
  Deno.env.get("SUPABASE_URL") || "",
  // Development
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);
```

This ensures Edge Functions accept requests from `affhubpro.com`, resolving CORS preflight failures on the custom domain.

---

## File Change Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/App.tsx` | Modify (2 deletions) | Remove onboarding route + import |
| `src/pages/Signup.tsx` | Modify (2 changes) | Redirect to dashboard instead of onboarding |
| `src/pages/Onboarding.tsx` | DELETE | Remove unused onboarding page |
| `src/pages/Settings.tsx` | Modify (1 change) | Default to Data Hub tab |
| `supabase/functions/_shared/cors.ts` | Modify (2 additions) | Add affhubpro.com to CORS allowlist |

---

## Post-Implementation Flow

### New User Journey (After Signup)

```text
User Signs Up → Dashboard (immediate access)
                    ↓
            Can connect integrations via:
            Settings → Integrations tab
```

### Existing User Journey

```text
User Logs In → Dashboard (immediate access)
                    ↓
            All features accessible without gates
```

---

## Security Verification

The CORS fix specifically addresses:

| Issue | Resolution |
|-------|------------|
| Edge functions rejecting `affhubpro.com` requests | Added to allowedOrigins |
| `www.affhubpro.com` variant not covered | Added both www and non-www variants |
| Origin validation still functional | Fallback logic preserved |

---

## Deployment Checklist

After implementation:

- [ ] Verify `/onboarding` returns 404
- [ ] New signup redirects to `/dashboard`
- [ ] Settings page opens to Data Hub tab by default
- [ ] Edge functions respond successfully from `affhubpro.com`
- [ ] All integrations (Awin, ShareASale) accessible via Settings → Integrations

