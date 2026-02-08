
# Plan: Integrate Resend for Automated Broken Link Alerts

## Executive Decisions Confirmed
- **Throttle Window**: 24 hours (one reminder per day maximum)
- **Alert Scope**: Only alert for links transitioning from `active` → `error`
- **Recovery Notifications**: YES - send "Link Recovered" email when status changes from `error` → `active`

## Architecture Overview

### How Status Change Detection Works
The `scan-link` edge function will fetch the link's current status before updating. Only if the status **changes** will we trigger email alerts:

```
Previous Status  →  New Status  →  Action
─────────────────────────────────────────
   active       →    error     →  Send "Link Broken" alert
   error        →    active    →  Send "Link Recovered" notification
   paused       →    error     →  NO EMAIL (user paused intentionally)
   active       →    active    →  NO EMAIL (no status change)
```

### Database Schema Update
Add tracking columns to `affiliate_links` table:
```sql
ALTER TABLE affiliate_links 
  ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_status TEXT;

CREATE INDEX IF NOT EXISTS idx_affiliate_links_last_alert 
  ON affiliate_links(last_alert_sent_at);
```

### Smart Throttling Logic
The edge function will check:
1. **Status Changed?** Only if `previous_status != new_status`
2. **Active → Error?** Only alert if transitioning from `active` to `error`
3. **24-Hour Cooldown?** Only if `last_alert_sent_at` is NULL or `> 24 hours ago`
4. **Fetch User Email**: Query profiles table for user's email via `user_id`

Example throttling check:
```typescript
const shouldAlert = 
  link.status === 'active' && // Was previously active
  newStatus === 'error' &&    // Now broken
  (!link.last_alert_sent_at || 
   Date.now() - new Date(link.last_alert_sent_at).getTime() > 86400000)
```

## File Changes

### 1. Database Migration
**File**: `supabase/migrations/[timestamp].sql`

Purpose: Add `last_alert_sent_at` and `previous_status` columns for tracking.

### 2. Edge Function Enhancement
**File**: `supabase/functions/scan-link/index.ts`

Changes:
- Fetch current link record before update (to detect status changes)
- Fetch user's email from profiles table
- Call send-email edge function when status changes
- Update `last_alert_sent_at` only when alert is sent
- Return additional metadata for debugging

Key logic additions:
```typescript
// Fetch current link to detect status change
const { data: currentLink } = await supabase
  .from("affiliate_links")
  .select("status, last_alert_sent_at")
  .eq("id", linkId)
  .single();

// Check if we should send alert
const wasActive = currentLink.status === "active";
const isNowError = newStatus === "error";
const isRecovery = currentLink.status === "error" && newStatus === "active";
const canSendAlert = !currentLink.last_alert_sent_at || 
  (Date.now() - new Date(currentLink.last_alert_sent_at).getTime() > 86400000);

if ((wasActive && isNowError && canSendAlert) || (isRecovery && canSendAlert)) {
  // Fetch user email and send alert
}
```

### 3. Email Templates Update
**File**: `supabase/functions/send-email/index.ts`

Add two new email types to the `emailTemplates` object:

**Template 1: `link_broken`**
- **Subject**: `⚠️ Your Affiliate Link is Broken – ${merchantName}`
- **Tone**: Urgent but professional
- **Content**: 
  - Highlight which merchant link is broken
  - Show HTTP status code
  - Suggest next steps (click to view link, manual inspection)
  - CTA: "Check Link Status" → `/settings` 

**Template 2: `link_recovered`**
- **Subject**: `✅ Good News – Your Affiliate Link is Back Online`
- **Tone**: Positive, reassuring
- **Content**:
  - Confirm which link is now working again
  - Show it's been restored to active
  - Thank user for their attention to detail
  - CTA: "View Link Vault" → `/settings`

Both templates match existing AffHubPro dark theme:
- Background: Dark navy gradient (#0a0a0a → #0f172a)
- Accent color: Gold (#d4af37) for primary elements
- Alert indicators: Red (#f87171) for broken, Green (#22c55e) for recovered

### 4. Resend Integration Points

The `send-email` function currently supports:
- `welcome` (new user)
- `password_reset` (auth)
- `sync_failed` (ShareASale)

Will add:
- `link_broken` (new alert type)
- `link_recovered` (new alert type)

Email interface will extend:
```typescript
interface EmailRequest {
  type: "welcome" | "password_reset" | "sync_failed" | "link_broken" | "link_recovered";
  to: string;
  data?: {
    name?: string;
    resetLink?: string;
    merchantName?: string;
    httpCode?: number;
    url?: string;
  };
}
```

## Implementation Sequence

1. **Run database migration** to add tracking columns
2. **Update send-email function** with new template types
3. **Update scan-link function** to:
   - Fetch link's previous status
   - Detect status changes
   - Call send-email when alert conditions are met
   - Update `last_alert_sent_at` timestamp

## Success Criteria

✅ User receives "Link Broken" email only when link transitions from active → error (not on manual pause)
✅ User receives "Link Recovered" email when link transitions from error → active
✅ Maximum one alert per link per 24 hours (smart throttling prevents spam)
✅ Email contains merchant name, HTTP status, and actionable CTA
✅ Email templates match AffHubPro dark theme aesthetic
✅ No console errors; graceful fallback if email fails (still update database status)

## Error Handling

If Resend call fails:
- Log error but **DO NOT block** the link status update
- Return successful status update response
- User can still see link status in UI; just won't receive email

This ensures link health tracking continues independently of email delivery.

