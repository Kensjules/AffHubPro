

# Update "From" Address to Verified Domain

## Change

One line in `supabase/functions/send-email/index.ts` (line 413):

```
// Before:
from: "AffHubPro <onboarding@resend.dev>",

// After:
from: "Jules <jules@affhubpro.com>",
```

This single change affects ALL email types dispatched through the `send-email` function (welcome, password_reset, sync_failed, link_broken, link_recovered), ensuring consistent branding from the verified domain.

## What stays unchanged
- All email templates (HTML content, subjects, styling)
- Link detection and alert logic in `scan-link`
- Dynamic recipient logic (`profile.email`)
- 24-hour throttling mechanism

## Deployment
The `send-email` edge function will be redeployed after the change.

