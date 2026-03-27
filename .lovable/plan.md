

# Landing Page & Navigation Refinements

## Changes

### 1. Header.tsx — Auth-aware navigation + remove Blueprint
- Import `useAuth` from `@/contexts/AuthContext`
- Remove the `Blueprint` nav link (line 22)
- Make the "Sign Out" button conditional: show "Sign Out" (calling `signOut()`) for authenticated users, show "Sign In" linking to `/login` for unauthenticated users
- The "Dashboard" link already points to `/dashboard` which is correct for both states (ProtectedRoute handles unauthenticated redirect)

### 2. HeroSection.tsx — Auth-aware CTA
- Import `useAuth` from `@/contexts/AuthContext`
- If authenticated: "Start Free Trial" button text becomes "Go to Dashboard", links to `/dashboard`
- If unauthenticated: keeps current behavior (links to `/signup`)

### 3. CTASection.tsx — Same auth-aware CTA
- Import `useAuth`
- If authenticated: button text "Go to Dashboard", links to `/dashboard`
- If unauthenticated: keeps "Start Your Free Trial" linking to `/signup`

## Files Modified
| File | Change |
|---|---|
| `src/components/landing/Header.tsx` | Remove Blueprint link, add auth-aware Sign In/Out button |
| `src/components/landing/HeroSection.tsx` | Auth-aware CTA destination |
| `src/components/landing/CTASection.tsx` | Auth-aware CTA destination |

No sidebar changes needed — greeting logic and status indicators are already implemented correctly.

