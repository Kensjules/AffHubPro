

# Refactor scan-link: Remove Debug Code and Stabilize

## Summary

Three targeted changes to `supabase/functions/scan-link/index.ts` to move from debug to production-ready state. The `send-email` function needs no changes -- the `from` address (`onboarding@resend.dev`) is already correct and its logging is appropriate.

## Changes

### 1. Restore dynamic email recipient (line 142)

Replace the hardcoded debug recipient with the dynamic `profile.email`:

```
// Before (debug):
to: "jstrut2121@gmail.com",  // DEBUG: hardcoded for testing

// After (production):
to: profile.email,
```

### 2. Remove debug console.log statements (lines 153-154, 158)

Remove the three debug log lines added during the investigation:

- Line 153: `console.log("send-email response status:", ...)`
- Line 154: `console.log("send-email response body:", ...)`
- Line 158: `console.log("Alert email sent: ... to jstrut2121@gmail.com")`

Keep `console.error` on line 166 (failed alerts) and line 170 (catch block) -- these are useful for production monitoring.

### 3. UI "Scan failed" root cause

The function already returns a valid HTTP 200 JSON response with `status`, `httpCode`, `responseTime`, `finalUrl`, `alertSent`, and `alertType` fields (lines 177-190). The "Scan failed" error is not caused by a missing response -- it is caused by the frontend's `LinkVault.tsx` error handling. The `supabase.functions.invoke` call throws when it encounters unexpected issues.

After reviewing the frontend code, the response structure is correct. The most likely cause of "Scan failed" is a transient network/CORS issue or an unhandled edge case during email dispatch that causes the function to throw before reaching the return statement. The error handling in the `catch` block (line 168-171) already prevents this, so removing the debug `await emailResponse.json()` call (which could throw on non-JSON responses) and ensuring it is wrapped safely will stabilize things.

**Safeguard**: Wrap the `emailResponseBody` parsing in a try-catch to prevent non-JSON responses from crashing the function:

```typescript
try {
  const emailResponse = await fetch(...);

  if (emailResponse.ok) {
    alertSent = true;
    await supabase
      .from("affiliate_links")
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq("id", linkId);
  } else {
    const errorBody = await emailResponse.text();
    console.error("Failed to send alert email:", errorBody);
  }
} catch (emailError) {
  console.error("Error sending alert email:", emailError);
}
```

## Technical Details

### Files modified
- `supabase/functions/scan-link/index.ts` -- remove debug code, restore dynamic recipient, harden email response parsing

### Files NOT modified
- `supabase/functions/send-email/index.ts` -- `from` address is already `onboarding@resend.dev`, logging is appropriate for production
- `src/components/dashboard/LinkVault.tsx` -- no changes needed, frontend handles responses correctly

### Deployment
Both edge functions will be redeployed automatically after changes.

