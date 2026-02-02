
Goal
- Implement a temporary “sledgehammer” fix so the Header gear icon always redirects to `/settings` via a hard browser redirect (`window.location.href`) and logs to the console to prove the click handler is firing.
- Keep layout/styling unchanged other than ensuring the button clearly shows it’s clickable (`cursor-pointer`).

What I found (current state)
- `src/components/landing/Header.tsx` currently uses `useNavigate()` and `onClick={() => navigate("/settings")}` with `className="... cursor-pointer"` and `aria-label="Settings"`.
- You explicitly want to bypass React Router and force a full page navigation using `window.location.href`.

Implementation changes (code-level)
1) Update the Gear button click handler in `src/components/landing/Header.tsx`
- Locate the Settings button (currently lines ~32–40).
- Replace the existing `onClick={() => navigate("/settings")}` with an inline handler that:
  - logs `Redirecting to settings...`
  - sets `window.location.href = "/settings";`

Modified code snippet (exact target)
```tsx
<Button
  variant="ghost"
  size="icon"
  className="text-muted-foreground cursor-pointer"
  onClick={() => {
    console.log("Redirecting to settings...");
    window.location.href = "/settings";
  }}
  aria-label="Settings"
>
  <Settings className="w-4 h-4" />
</Button>
```

2) Clean up now-unused React Router navigation imports (to avoid dead code)
- Because we will no longer use `useNavigate`, remove:
  - `useNavigate` from the `react-router-dom` import
  - `const navigate = useNavigate();` inside the component
- Keep `Link` import as-is because the header still uses `<Link>` for `/` and `/dashboard` (and the sign-out link).

Testing plan (automated)
Update `src/components/landing/Header.test.tsx` to validate the new behavior:
- Remove the `useNavigate` mock (no longer relevant).
- Add a test that:
  - renders `<Header />`
  - finds the Settings button via `button[aria-label="Settings"]`
  - clicks it
  - asserts that:
    - `console.log` was called with `"Redirecting to settings..."`
    - `window.location.href` was set to `"/settings"`

Notes on implementing the test safely
- In JSDOM, `window.location` / `window.location.href` can be non-writable.
- To reliably test this, we will:
  - temporarily replace `window.location` with a writable mock (using `Object.defineProperty`)
  - restore the original location after the test
- Also mock `console.log` with `vi.spyOn(console, "log")` so the test doesn’t spam output and we can assert it was called.

Manual verification steps (UI)
1) Open the landing page (`/`).
2) Hover the gear icon:
   - Confirm the pointer cursor appears (already ensured by `cursor-pointer` on the Button).
3) Click the gear icon:
   - Confirm the browser navigates to `/settings` via a full page load.
4) Open DevTools console:
   - Confirm you see: `Redirecting to settings...`

Deployment / immediate verification
- After implementing the code change and updated test:
  - Run the automated test suite to confirm it passes.
  - Publish/deploy to your live environment (or designated staging) so you can confirm the bug is resolved where it was observed (“LIVE header”).

Challenges / risks anticipated
- Unit test mocking for `window.location.href` can be tricky due to read-only behavior in JSDOM; we’ll handle that by safely redefining `window.location` for the duration of the test.
- This is intentionally a temporary workaround: a hard redirect refreshes the app and may be less smooth than router navigation, but it’s the most reliable proof that the click handler is firing and the route exists.

Acceptance criteria mapping
- Gear icon responds to clicks: Achieved by explicit `onClick` handler.
- Hard redirect to `/settings`: Achieved via `window.location.href = "/settings"`.
- Visual clickable feedback: Confirmed via `cursor-pointer` on the Button.
- Console confirmation: Achieved via `console.log("Redirecting to settings...")` inside the handler.
- Test coverage: Updated test will validate the handler fires and the redirect assignment occurs.
