

# Rename "FAQ" to "How It Works" in Header

## Change

**`src/components/landing/Header.tsx` — line 23**

Change:
```tsx
<a href="#how-it-works" className="nav-link">FAQ</a>
```
To:
```tsx
<a href="#how-it-works" className="nav-link">How It Works</a>
```

The link already points to `#how-it-works`, which is the `id` on the `HowItWorksSection` (the "three simple steps" section). So clicking it will scroll to the correct section. Only the label text needs updating.

