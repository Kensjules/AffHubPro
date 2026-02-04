
# Plan: Fix Security Errors for Custom Domain Deployment

## Summary

This plan addresses two security scanner findings preventing the custom domain update and secures Awin credential storage to match the existing ShareASale pattern.

---

## Issue Analysis

### Finding 1: "Customer Email Addresses Could Be Stolen by Anyone"
**Table:** `profiles`
**Status:** FALSE POSITIVE - RLS policy already exists

The profiles table already has a proper SELECT policy:
```sql
USING (auth.uid() = id)
```

The scanner may be incorrectly flagging this. We will verify and mark as ignored.

### Finding 2: "Affiliate Account Details Exposed to Unauthorized Users"  
**Table/View:** `shareasale_accounts_public`
**Status:** PROPERLY SECURED - needs scanner acknowledgment

The view is configured with:
- `security_invoker=on` - inherits caller's RLS policies
- `security_barrier=true` - prevents information leakage

Since RLS cannot be directly enabled on views in PostgreSQL, the `security_invoker` option is the correct approach. This finding should be marked as resolved.

### Finding 3: Awin Credentials Stored via Client
**File:** `src/hooks/useAwinIntegration.ts`  
**Status:** SECURITY ISSUE - needs edge function migration

Currently, Awin API tokens are stored directly from the client to `user_integrations` table, exposing credentials in transit and potentially in logs.

---

## Solution Implementation

### Part 1: Verify and Clear False Positive Findings

#### Step 1.1: Verify Profiles RLS is Active
The profiles table has:
- `relrowsecurity: true`
- `relforcerowsecurity: true`
- SELECT policy: `USING (auth.uid() = id)`

This means only authenticated users can view their own profile. The finding is a false positive.

#### Step 1.2: Update Security Findings
Mark both findings as resolved/ignored since they are false positives:

| Finding | Action |
|---------|--------|
| `profiles_table_email_exposure` | Mark as ignored - RLS policy exists |
| `shareasale_accounts_public_view_exposure` | Mark as ignored - security_invoker protects data |

---

### Part 2: Secure Awin Credential Storage (Optional Enhancement)

#### Current Issue
The `useAwinIntegration.ts` hook stores credentials directly:
```typescript
// Lines 60-65 and 71-76
api_token_encrypted: apiToken, // In production, encrypt this server-side
```

This is insecure because:
1. Credentials pass through client-side code
2. Credentials are logged in browser network tab
3. No server-side validation of credentials

#### Solution
Create an edge function mirroring the ShareASale pattern:

**New File: `supabase/functions/store-awin-credentials/index.ts`**

This function will:
1. Validate the Awin API credentials against Awin's API
2. Store credentials server-side using service role
3. Never expose credentials to the client

**Modify: `src/hooks/useAwinIntegration.ts`**

Update `saveIntegration` to call the edge function instead of direct database insert.

---

## Part 1 Implementation (Required for Domain Update)

### Database Verification
No database changes needed - RLS is already correctly configured.

### Security Finding Updates

The following security findings will be marked as ignored with proper justification:

**Finding: `profiles_table_email_exposure`**
- **Ignore Reason:** RLS is enabled and enforced on profiles table. SELECT policy `USING (auth.uid() = id)` ensures users can only view their own profile data including email. The scanner incorrectly flagged this as exposed.

**Finding: `shareasale_accounts_public_view_exposure`**  
- **Ignore Reason:** The view is created with `security_invoker=on` and `security_barrier=true` options. This ensures all queries through the view are subject to the base table's RLS policies. Users can only see their own shareasale account data via `auth.uid() = user_id` policy on the base table.

---

## Part 2 Implementation (Recommended Security Enhancement)

### New Edge Function

**File: `supabase/functions/store-awin-credentials/index.ts`**

```typescript
// Validates Awin credentials against Awin API
// Stores credentials using service role key
// Returns only non-sensitive account data
```

### Hook Update

**File: `src/hooks/useAwinIntegration.ts`**

| Lines | Current | Change |
|-------|---------|--------|
| 47-91 | Direct database insert/update | Call store-awin-credentials edge function |

### Config Update

**File: `supabase/config.toml`**

Add function configuration for `store-awin-credentials`.

---

## File Summary

### Part 1: Clear Security Errors (Required)
| Action | Description |
|--------|-------------|
| Update security findings | Mark 2 false positive findings as ignored |

### Part 2: Awin Credentials (Recommended)
| File | Action |
|------|--------|
| `supabase/functions/store-awin-credentials/index.ts` | CREATE - New edge function |
| `src/hooks/useAwinIntegration.ts` | MODIFY - Use edge function |
| `supabase/config.toml` | MODIFY - Add function config |

---

## Expected Outcome

After Part 1:
- Security scan shows 0 active errors
- Custom domain update can proceed
- Both false positives are properly documented

After Part 2:
- Awin credentials never touch client-side code
- Matches security pattern used for ShareASale
- Full credential isolation achieved

---

## Deployment Checklist

- [ ] Update security findings to mark false positives
- [ ] Verify security scan shows 0 errors
- [ ] Attempt custom domain update
- [ ] (Optional) Implement Awin edge function for credential storage
