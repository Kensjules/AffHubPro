

# Plan: Analytics Engine Foundation (Phase 2)

## Executive Summary

This plan addresses four foundational components for the analytics engine: header navigation fix, database schema review, security hardening for API credentials, and automated testing.

---

## Current State Analysis

### Header Navigation (Gear Icon)

**Finding:** The landing page header (`src/components/landing/Header.tsx`) has a Settings gear icon that is **NOT linked** to any route:

```tsx
// Line 30-32 - Currently just a button with no navigation
<Button variant="ghost" size="icon" className="text-muted-foreground">
  <Settings className="w-4 h-4" />
</Button>
```

**Dashboard sidebar already works:** The authenticated sidebar (`DashboardSidebar.tsx`) correctly links to `/settings` at line 28.

### Database Schema

**Finding:** The `user_integrations` table **already exists** with the required structure:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to `auth.users`, CASCADE delete |
| `integration_type` | TEXT | Platform identifier (e.g., 'awin') |
| `publisher_id` | TEXT | Platform-specific ID |
| `api_token_encrypted` | TEXT | Token storage |
| `is_connected` | BOOLEAN | Default false |
| `last_sync_at` | TIMESTAMP | Last sync time |
| `created_at` / `updated_at` | TIMESTAMP | Auto-managed |

**Missing columns per request:** `platform_name`, `api_key`, `api_secret`

### Security Architecture

**Finding:** The project uses a secure edge function pattern (`store-shareasale-credentials`) that:
- Uses the service role key for server-side storage
- Validates user tokens before storing
- Never exposes credentials to the client
- Provides a public view (`shareasale_accounts_public`) that excludes sensitive columns

**Current Gap:** The `api_token_encrypted` column stores plaintext (not actually encrypted). True encryption requires Supabase Vault integration.

### Testing Infrastructure

**Finding:** Vitest is properly configured with jsdom environment and React Testing Library. Example test exists at `src/test/example.test.ts`.

---

## Implementation Plan

### Task 1: Fix Header Gear Icon Navigation

**Scope:** Wrap the Settings gear icon in a `Link` component pointing to `/settings`.

**File:** `src/components/landing/Header.tsx`

**Change:**
```tsx
// Before (lines 30-32)
<Button variant="ghost" size="icon" className="text-muted-foreground">
  <Settings className="w-4 h-4" />
</Button>

// After
<Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
  <Link to="/settings">
    <Settings className="w-4 h-4" />
  </Link>
</Button>
```

**Effort:** Minimal (single line change)

---

### Task 2: Database Schema Enhancement

**Decision Required:** The existing `user_integrations` table uses `integration_type` instead of `platform_name`. Two options:

**Option A (Recommended):** Use existing structure - `integration_type` serves the same purpose as `platform_name`. Add only missing columns.

**Option B:** Rename `integration_type` to `platform_name` (breaking change).

**Migration to add missing columns:**

```sql
-- Add api_secret column for platforms requiring separate key/secret
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS api_secret_encrypted TEXT;

-- Rename api_token_encrypted to api_key_encrypted for clarity (optional)
-- Note: This would require updating existing code
```

**RLS Policies:** Already implemented correctly - users can only access their own integrations.

---

### Task 3: Credential Encryption with Edge Functions

**Current Approach (Already Implemented):**
The project uses server-side edge functions with the service role key. This is a valid security pattern that:
- Keeps credentials server-side only
- Uses RLS to prevent client-side access to sensitive columns
- Provides a public view excluding credentials

**Enhanced Security Option - Supabase Vault:**

Supabase Vault provides transparent encryption at rest. However, it requires:
1. Enabling the `pgsodium` extension
2. Creating encryption keys
3. Modifying storage to use encrypted columns

**Recommended Approach:** Continue using the current edge function pattern as it already provides:
- Credentials never sent to the client
- Server-side storage via service role
- RLS protection on base tables
- Public view pattern for safe client queries

If additional encryption is needed, I can add Vault integration as a follow-up task.

---

### Task 4: Automated Navigation Test

**New file:** `src/components/landing/Header.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Header } from "./Header";

describe("Header", () => {
  it("renders settings gear icon with correct link to /settings", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find the settings link
    const settingsLink = screen.getByRole("link", { name: /settings/i });
    
    // Verify it links to /settings
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });
});
```

---

## Technical Architecture Summary

```text
+-------------------+     +----------------------+     +------------------+
|   Landing Page    |     |   Dashboard Pages    |     |   Settings Page  |
|   Header.tsx      |     |   DashboardSidebar   |     |   Settings.tsx   |
|   (Gear Icon) ----+---->|   (Gear Icon) -------+---->|                  |
+-------------------+     +----------------------+     +------------------+
                                    |
                                    v
                          +------------------+
                          |  user_integrations  |
                          |  (Database Table)   |
                          +------------------+
                                    |
                          +------------------+
                          | Edge Function     |
                          | (Service Role)    |
                          | - Stores creds    |
                          | - Server-side     |
                          +------------------+
```

---

## Deliverables

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Fix Header gear icon to link to `/settings` | Ready to implement | High |
| 2 | Add `api_secret_encrypted` column to `user_integrations` | Ready to implement | Medium |
| 3 | Verify edge function credential security (already secure) | Complete | High |
| 4 | Create automated test for gear icon navigation | Ready to implement | Medium |

---

## Files to Modify

1. `src/components/landing/Header.tsx` - Add Link wrapper to Settings button
2. `src/components/landing/Header.test.tsx` - Create new test file
3. Database migration (optional) - Add `api_secret_encrypted` column

---

## Post-Implementation Verification

1. Click gear icon in landing page header, confirm navigation to `/settings`
2. Run automated test: `npm run test` or use the test tool
3. Verify RLS policies prevent cross-user access
4. Confirm edge functions continue to work for credential storage

