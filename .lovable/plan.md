

# Beta Launch Hotfixes

## 1. Enable Auto-Confirm Email Signups (HIGH PRIORITY)

Auth logs show `email_not_confirmed` errors blocking login. Use `cloud--configure_auth` to enable auto-confirm for the beta phase. This immediately unblocks all new and existing unconfirmed users.

## 2. Fix Post-Signup Redirect Loop

The `Signup.tsx` page (line 68) navigates to `/dashboard` immediately after `signUp()`, but since email confirmation is required, the user can't actually log in. With auto-confirm enabled (step 1), this flow will work. Additionally, the `signUp` function in `AuthContext.tsx` already sends a welcome email — but `Signup.tsx` ALSO sends one (duplicate). Remove the duplicate welcome email call from `Signup.tsx` (lines 62-67).

## 3. Remove "View Live Demo" Button

In `src/components/landing/HeroSection.tsx`, delete lines 56-61 (the glass button linking to `/demo`). Also remove the `Play` import from line 3.

## 4. Remove "Soon" Badges from Sidebar

In `src/components/dashboard/DashboardSidebar.tsx`:
- Remove `disabled: true` from Stores and Reports nav items (lines 25-26)
- Remove the "Soon" badge rendering (lines 101-105)

## 5. First-Name Greeting

Already implemented in Dashboard.tsx (line 41). No change needed.

## Files Modified

| File | Change |
|---|---|
| `src/components/landing/HeroSection.tsx` | Remove "View Live Demo" button + unused `Play` import |
| `src/components/dashboard/DashboardSidebar.tsx` | Remove `disabled` flags and "Soon" badges from Stores/Reports |
| `src/pages/Signup.tsx` | Remove duplicate welcome email call |
| Auth config | Enable auto-confirm email signups via configure_auth tool |

## What Does NOT Need Changing

- **Landing page stats**: Already updated to "ShareASale/Awin Integration Live", "Real-Time Data Sync", "Built for Affiliate Marketers" — the old "50+ Affiliate Networks" / "10K+ Active Users" / "$2M+ Revenue Tracked" text no longer exists
- **ShareASale connection**: Already optional — the onboarding gate is commented out in Dashboard.tsx (lines 43-46)
- **First-name greeting**: Already implemented with `.split(" ")[0]` logic

