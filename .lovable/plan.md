

# Plan: Fix Unresponsive Gear Icon in Header

## Root Cause Analysis

**Identified Issue:** The `Button` component applies `[&_svg]:pointer-events-none` to all child SVG elements (line 8 of `button.tsx`). This CSS rule disables click events on the Settings icon.

**Why this matters for the gear icon:**
- When using `asChild` with a Link, the Button renders the Link as its root element
- The Settings SVG icon is inside the Link
- The SVG covers most of the clickable area
- `pointer-events: none` on the SVG means clicks on the icon dont register on the underlying Link

**Current structure (lines 30-34 of Header.tsx):**
```tsx
<Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
  <Link to="/settings">
    <Settings className="w-4 h-4" />  // <-- pointer-events: none applied here
  </Link>
</Button>
```

---

## Solution

Replace the `asChild` pattern with programmatic navigation using `useNavigate`. This approach:
1. Uses a standard Button element (not a Link via `asChild`)
2. Handles click events with an `onClick` handler
3. Navigates programmatically to `/settings`
4. Ensures the SVG icon is purely decorative while the button handles all interactions

---

## Implementation

### Changes to `src/components/landing/Header.tsx`

**Add useNavigate import:**
```tsx
import { Link, useNavigate } from "react-router-dom";
```

**Add navigation hook in component:**
```tsx
export function Header() {
  const navigate = useNavigate();
  // ...
}
```

**Replace the Settings button (lines 30-34):**
```tsx
// Before
<Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
  <Link to="/settings">
    <Settings className="w-4 h-4" />
  </Link>
</Button>

// After
<Button 
  variant="ghost" 
  size="icon" 
  className="text-muted-foreground cursor-pointer"
  onClick={() => navigate("/settings")}
  aria-label="Settings"
>
  <Settings className="w-4 h-4" />
</Button>
```

---

## Why This Works

| Aspect | Before | After |
|--------|--------|-------|
| Element type | Link (via asChild) | Button |
| Click handling | Browser link navigation | onClick handler |
| SVG clickability | Blocked by `pointer-events-none` | Irrelevant - button handles clicks |
| Cursor style | Default link behavior | Explicit `cursor-pointer` class |
| Accessibility | Implicit link semantics | Explicit `aria-label` for screen readers |

---

## Alternative Considered

Removing `[&_svg]:pointer-events-none` from the Button component globally would fix this issue but could cause unintended side effects:
- SVG icons in buttons might intercept drag events unexpectedly
- May affect icon button behavior in other parts of the app
- The `pointer-events-none` pattern is intentional for most button use cases

The targeted fix using `onClick` is safer and more explicit.

---

## Test Update

The existing test in `Header.test.tsx` checks for an anchor element with `href="/settings"`. Since were switching to `onClick` navigation, the test should verify:
1. A button with the Settings icon exists
2. Clicking it triggers navigation (using a mocked `useNavigate`)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/landing/Header.tsx` | Add `useNavigate`, replace Settings Link with Button + onClick |
| `src/components/landing/Header.test.tsx` | Update test to verify button click behavior |

---

## Post-Implementation Verification

1. Navigate to the landing page (/)
2. Hover over the gear icon - confirm cursor changes to pointer
3. Click the gear icon - confirm navigation to /settings
4. Run automated tests to verify behavior

