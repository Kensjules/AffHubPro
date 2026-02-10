
# Debug Plan: Fix Resend Email Alert Delivery

## Root Cause Analysis

Two issues are preventing email delivery:

1. **Unverified "From" address**: The `send-email` function uses `jules@affhubpro.com` as the sender. If this domain is not verified in Resend, all emails silently fail. For testing, Resend requires using `onboarding@resend.dev`.

2. **Insufficient logging**: The `scan-link` function logs success/failure of the `send-email` call but does not capture the full Resend API response body, making it impossible to diagnose delivery issues from edge function logs.

## Changes Required

### File 1: `supabase/functions/send-email/index.ts`

**Change the "from" address** (line 413) from:
```
from: "Jules from AffHubPro <jules@affhubpro.com>"
```
to:
```
from: "AffHubPro <onboarding@resend.dev>"
```

**Add detailed response logging** after the Resend API call (around line 420-421), expanding the existing `console.log` to include the full response status and body:
```typescript
const result = await response.json();
console.log("Resend API response status:", response.status);
console.log("Resend API full response:", JSON.stringify(result));
```

### File 2: `supabase/functions/scan-link/index.ts`

**Hardcode test recipient** (line 142) -- temporarily override `profile.email` with `jstrut2121@gmail.com` for debugging:
```typescript
to: "jstrut2121@gmail.com",  // DEBUG: hardcoded for testing
```

**Add response body logging** after the `send-email` fetch call (around line 152-163). Capture and log the full response from the `send-email` function:
```typescript
const emailResponseBody = await emailResponse.json();
console.log("send-email response status:", emailResponse.status);
console.log("send-email response body:", JSON.stringify(emailResponseBody));
```

### File 3: `src/components/dashboard/LinkVault.tsx`

No changes needed -- the frontend already passes `linkId` to the edge function and displays scan results correctly.

## Implementation Sequence

1. Update `send-email/index.ts`: Change "from" address to `onboarding@resend.dev` and enhance logging
2. Update `scan-link/index.ts`: Hardcode test recipient and add response logging
3. Deploy both edge functions
4. Test by scanning a known broken URL from the Link Vault UI
5. Check edge function logs for the full Resend API response

## Post-Debug Reversion Steps

Once email delivery is confirmed working:
- Revert the "from" address to `jules@affhubpro.com` (after verifying the domain in Resend)
- Remove the hardcoded `jstrut2121@gmail.com` recipient
- Keep the enhanced logging (it is useful for production monitoring)

## Success Criteria

- Edge function logs show a `200` response from the Resend API with a message ID
- An email arrives at `jstrut2121@gmail.com` with the "Broken Link Detected" template
- The `last_alert_sent_at` column updates in the database after a successful alert
