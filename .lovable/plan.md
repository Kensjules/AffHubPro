

# Fix Routing 404s, SPA Refresh, and Stripe Checkout Loop

## Root Causes Identified

1. **`/stores` and `/reports` 404s**: The sidebar links to these paths but no routes or pages exist in `App.tsx`.
2. **SPA refresh 404s**: No `_redirects` file for the static host. The existing `404.html` helps but a `_redirects` is more reliable.
3. **"Upgrade to Pro" loop**: In `Settings.tsx` (line 297), the button links to `/#pricing`. But `FrontDoorRoute` in `App.tsx` redirects authenticated users from `/` to `/dashboard` — so they never see the pricing section. This creates a dashboard loop.

## Changes

### 1. Create `src/pages/Stores.tsx` and `src/pages/Reports.tsx`
Simple placeholder pages with the `DashboardSidebar` layout, showing a "Coming Monday" message. Minimal components — just the sidebar + a centered card.

### 2. Register routes in `src/App.tsx`
Add two new protected routes:
```
<Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
<Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
```

### 3. Create `public/_redirects`
Single line: `/* /index.html 200` — standard SPA catch-all for Netlify/Lovable hosting.

### 4. Fix "Upgrade to Pro" in Settings.tsx
Replace the `<a href="/#pricing">Upgrade to Pro</a>` link (line 296-298) with a button that directly calls `startCheckout()` from `useSubscription`. This bypasses the redirect loop entirely — clicking "Upgrade to Pro" will invoke the edge function and open Stripe Checkout in a new tab.

```tsx
<Button variant="hero" onClick={handleCheckout} disabled={checkingOut}>
  {checkingOut ? "Processing..." : "Upgrade to Pro"}
</Button>
```

This requires adding `startCheckout` to the existing `useSubscription` destructure and a `handleCheckout` + `checkingOut` state in the Settings component.

## Files

| File | Action |
|---|---|
| `src/pages/Stores.tsx` | Create — placeholder with sidebar |
| `src/pages/Reports.tsx` | Create — placeholder with sidebar |
| `src/App.tsx` | Add `/stores` and `/reports` routes |
| `src/pages/Settings.tsx` | Replace pricing link with direct `startCheckout()` call |
| `public/_redirects` | Create — SPA catch-all rule |

