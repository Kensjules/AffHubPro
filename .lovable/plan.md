

# Center Header Nav with Absolute Positioning

## Change

**`src/components/landing/Header.tsx` — line 11 and line 21**

1. Add `relative` to the parent flex container (line 11)
2. Change the `<nav>` to use absolute centering (line 21)

```tsx
// Line 11: add "relative"
<div className="container mx-auto px-4 h-16 flex items-center justify-between relative">

// Line 21: absolute center on md+, hidden on smaller screens
<nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
```

This uses Tailwind's `absolute left-1/2 -translate-x-1/2` which is equivalent to the requested `position: absolute; left: 50%; transform: translateX(-50%)`. The `hidden md:flex` already handles the responsive breakpoint — nav is completely hidden below `md` (768px), preventing any overlap.

Single file, two lines changed.

