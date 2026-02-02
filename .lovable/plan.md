
# Plan: Affiliate Integrations Section in Settings Page

## Overview

Enhance the Settings page with a comprehensive "Integrations" tab that allows users to connect both **Awin** and **ShareASale** accounts directly from the Settings page, without needing to navigate to the separate Integrations page or Onboarding flow.

---

## Current State Analysis

### Existing Infrastructure
- **Settings.tsx**: Has 3 tabs (Account, ShareASale, Security) with a basic ShareASale status display
- **Integrations.tsx**: A separate page at `/integrations` with Awin connection
- **Database Tables**:
  - `shareasale_accounts`: Stores ShareASale credentials (merchant_id, api_token_encrypted, api_secret_encrypted)
  - `user_integrations`: Stores Awin/other integrations (publisher_id, api_token_encrypted, api_secret_encrypted)
- **Existing Hooks**: `useShareASale.ts` and `useAwinIntegration.ts` already handle API connections
- **Edge Functions**: `validate-shareasale` and `store-shareasale-credentials` handle secure credential storage

### Click-Blocking Issue
The Header's gear icon works but the HeroSection's animated background effects may still cause issues on some browsers. Adding `pointer-events: none` to the HeroSection wrapper will permanently fix this.

---

## Implementation Plan

### Part 1: HeroSection Click-Blocking Fix

**File:** `src/components/landing/HeroSection.tsx`

Add `pointer-events: none` to the animated background container so clicks pass through to the Header:

```tsx
{/* Background Effects - pointer-events: none to allow header clicks */}
<div className="absolute inset-0 -z-10" style={{ pointerEvents: 'none' }}>
  {/* ... existing background effects ... */}
</div>
```

---

### Part 2: Create ShareASale Connect Dialog Component

**New File:** `src/components/integrations/ShareASaleConnectDialog.tsx`

Create a modal dialog (matching the existing AwinConnectDialog pattern) for connecting ShareASale:

| Field | Type | Description |
|-------|------|-------------|
| Merchant/Affiliate ID | text | The user's ShareASale affiliate ID |
| API Token | password | Masked API token input |
| API Secret | password | Masked API secret input |

Features:
- Password-type inputs with show/hide toggle for security
- Client-side Zod validation (min lengths, required fields)
- Calls existing `useConnectShareASale` hook on submit
- Loading states during validation/submission
- External link to ShareASale API documentation

---

### Part 3: Enhance Settings Page with Integrations Tab

**File:** `src/pages/Settings.tsx`

#### 3.1 Add "Integrations" Tab
Rename/replace the existing "ShareASale" tab with a combined "Integrations" tab that shows both Awin and ShareASale:

```tsx
const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "integrations", label: "Integrations", icon: Link2 },  // Renamed
  { id: "security", label: "Security", icon: Shield },
];
```

#### 3.2 Integrations Tab Content

Create two integration cards within the tab:

**ShareASale Card:**
- Shows connection status (Connected/Not Connected badge)
- When not connected: Shows "Connect" button that opens ShareASaleConnectDialog
- When connected: Shows masked Merchant ID, last sync time, Sync Now button, Disconnect button

**Awin Card:**
- Shows connection status
- When not connected: Shows "Connect" button that opens AwinConnectDialog
- When connected: Shows Publisher ID, last sync time, Settings/Sync buttons

Both cards follow the existing glass card design pattern with consistent styling.

---

### Part 4: Remove Temporary Emergency Button

**File:** `src/App.tsx`

Remove the temporary red "GO TO SETTINGS" emergency button now that the underlying issue is resolved.

---

## Component Structure

```text
Settings.tsx
├── Tabs: Account | Integrations | Security
│
└── Integrations Tab
    ├── ShareASale Card
    │   ├── Logo + Status Badge
    │   ├── Connection Info (when connected)
    │   │   ├── Masked Merchant ID
    │   │   ├── Last Sync Time
    │   │   ├── Sync Now Button
    │   │   └── Disconnect Button
    │   └── Connect Button (when not connected)
    │       └── Opens ShareASaleConnectDialog
    │
    └── Awin Card
        ├── Logo + Status Badge
        ├── Connection Info (when connected)
        │   ├── Publisher ID
        │   ├── Last Sync Time
        │   ├── Settings Button
        │   └── Sync Now Button
        └── Connect Button (when not connected)
            └── Opens AwinConnectDialog
```

---

## Technical Implementation Details

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/integrations/ShareASaleConnectDialog.tsx` | Modal dialog for ShareASale credential entry |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Add `pointer-events: none` to background effects container |
| `src/pages/Settings.tsx` | Add Integrations tab with both Awin and ShareASale cards |
| `src/App.tsx` | Remove emergency settings button |

### Existing Resources to Reuse

- `useShareASaleAccount()` - Check ShareASale connection status
- `useConnectShareASale()` - Connect ShareASale with credentials
- `useDisconnectShareASale()` - Disconnect ShareASale
- `useSyncShareASale()` - Trigger data sync
- `useAwinIntegration()` - All Awin operations
- `AwinConnectDialog` - Existing dialog pattern to follow
- Zod validation schema from Onboarding.tsx

---

## Security Considerations

1. **Password Inputs**: All credential fields use `type="password"` with optional show/hide toggles
2. **Client-Side Only**: Credentials are only held in component state during form submission
3. **Server-Side Storage**: Credentials are sent to edge functions which handle secure, encrypted storage
4. **No Plain Text**: Credentials are never stored in client-side state after submission completes
5. **Existing Security**: Leverages existing secure edge functions (`store-shareasale-credentials`)

---

## UI/UX Design

### Connection Status Badges
- **Connected**: Green badge with checkmark icon
- **Not Connected**: Gray/amber badge with warning icon

### Card Layout
Each integration card includes:
- Network logo (ShareASale blue, Awin teal)
- Status badge (top-right)
- Description text
- Action buttons (Connect, Sync, Disconnect)

### Error Handling
- Toast notifications for success/failure
- Inline validation errors on form fields
- Loading spinners during async operations

---

## Testing Checklist

After implementation:
1. Navigate to `/settings`
2. Click "Integrations" tab
3. Verify both ShareASale and Awin cards appear
4. Test ShareASale connection flow:
   - Click "Connect ShareASale"
   - Enter credentials in dialog
   - Verify validation works
   - Submit and confirm success toast
5. Test Awin connection flow similarly
6. Verify Sync and Disconnect buttons work
7. Test the Header gear icon still navigates to Settings
8. Confirm no visual regressions

