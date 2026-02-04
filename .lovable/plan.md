
# Plan: Master Revenue Interface Upgrade

## Executive Summary

This upgrade transforms the dashboard from a debugging state into a revenue-generating platform with three key features: confirming the header click fix, implementing a Live Revenue Feed, and building a Broken Link Recovery Tool.

---

## Part 1: Confirm HeroSection Click-Blocking Fix

### Status: Already Implemented

The `pointer-events: none` fix has already been applied to `src/components/landing/HeroSection.tsx` (line 9):

```tsx
<div className="absolute inset-0 -z-10" style={{ pointerEvents: 'none' }}>
```

**No additional changes needed** - the gear icon in the Header is now fully clickable.

---

## Part 2: Live Revenue Feed Card on Settings Page

### Overview

Create a new "DATA HUB" section in Settings with a Live Revenue Feed card displaying:
- **Potential Commission**: Sum of pending/locked transactions
- **Actual Commission**: Sum of paid transactions  
- Real-time auto-refresh every 60 seconds
- Manual refresh button

### New Components

**New File: `src/components/dashboard/LiveRevenueFeed.tsx`**

A reusable card component displaying:

| Metric | Source | Color |
|--------|--------|-------|
| Potential Commission | pending + locked transactions | Gold/Warning |
| Actual Commission | paid transactions | Green/Success |
| Last Updated | Client timestamp | Muted |

Features:
- Auto-refresh using `refetchInterval` in React Query
- Animated pulse indicator when live
- Loading skeleton states
- Error state with retry button

**New Hook: `src/hooks/useLiveRevenue.ts`**

```tsx
interface LiveRevenueData {
  potentialCommission: number;  // pending + locked
  actualCommission: number;     // paid
  lastUpdated: Date;
  awinConnected: boolean;
  shareASaleConnected: boolean;
}
```

Query configuration:
- `refetchInterval: 60000` (60 seconds)
- `refetchIntervalInBackground: true`
- Aggregates data from `transactions_cache`

### Settings Page Changes

**File: `src/pages/Settings.tsx`**

Add a new "Data Hub" tab after Integrations:

```tsx
const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "datahub", label: "Data Hub", icon: Activity },  // NEW
  { id: "security", label: "Security", icon: Shield },
];
```

Data Hub tab content:
- LiveRevenueFeed card (primary)
- Connection status summary (shows which networks are connected)
- Quick sync buttons for all connected networks

---

## Part 3: Broken Link Recovery Tool on Dashboard

### Overview

Build a proactive link health monitoring system that:
1. Scans stored affiliate links for 404 errors
2. Highlights broken links in RED
3. Suggests recovery alternatives

### Database Schema Changes

**New Table: `affiliate_links`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner reference |
| url | text | The affiliate link URL |
| merchant_name | text | Associated merchant |
| network | text | 'shareasale' or 'awin' |
| status | text | 'active', 'broken', 'recovered' |
| last_checked_at | timestamp | Last health check |
| http_status_code | integer | Last response code |
| recovery_suggestion | text | Suggested alternative URL |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

RLS Policy: Users can only CRUD their own links.

### New Edge Function: `scan-affiliate-links`

**File: `supabase/functions/scan-affiliate-links/index.ts`**

Functionality:
1. Fetches user's affiliate links from `affiliate_links` table
2. For each link, performs HEAD request (faster than GET)
3. Updates `status`, `http_status_code`, `last_checked_at`
4. If 404 detected:
   - Sets status to 'broken'
   - Queries alternative links from same merchant
   - Sets `recovery_suggestion` if found

Rate limiting:
- Max 50 links per scan
- 500ms delay between requests
- Timeout after 30 seconds

### New Components

**New File: `src/components/dashboard/BrokenLinkScanner.tsx`**

A dashboard card showing:

```text
+------------------------------------------+
|  Link Health Monitor           [Scan Now]|
+------------------------------------------+
|  ○ 45 Active Links                       |
|  ● 3 Broken Links (RED highlight)        |
|                                          |
|  [Broken Link List]                      |
|  ┌────────────────────────────────────┐ |
|  │ 🔴 amazon.com/dp/B08XYZ... [404]  │ |
|  │    Suggestion: amazon.com/dp/NEW  │ |
|  │    [Replace Link] [Ignore]        │ |
|  └────────────────────────────────────┘ |
+------------------------------------------+
```

Features:
- Broken links highlighted in RED with destructive styling
- One-click "Replace Link" action
- "Ignore" option to dismiss warnings
- Last scan timestamp
- Manual scan trigger button

**New Hook: `src/hooks/useAffiliateLinks.ts`**

```tsx
// Fetch all user's affiliate links
useAffiliateLinks()

// Fetch only broken links
useBrokenLinks()

// Trigger link scan
useScanLinks()

// Replace a broken link with suggestion
useReplaceLink()
```

### Dashboard Integration

**File: `src/pages/Dashboard.tsx`**

Add BrokenLinkScanner card after the Revenue Chart:

```tsx
{/* Revenue Chart */}
<div className="mb-8">
  <RevenueChart data={chartData} isLoading={chartLoading} />
</div>

{/* NEW: Link Health Monitor */}
<div className="mb-8">
  <BrokenLinkScanner />
</div>

{/* Recent Transactions */}
<RecentTransactionsTable ... />
```

---

## Implementation Sequence

### Phase 1: Live Revenue Feed (Priority: High)

| Step | Task | Files |
|------|------|-------|
| 1.1 | Create useLiveRevenue hook | `src/hooks/useLiveRevenue.ts` |
| 1.2 | Create LiveRevenueFeed component | `src/components/dashboard/LiveRevenueFeed.tsx` |
| 1.3 | Add Data Hub tab to Settings | `src/pages/Settings.tsx` |
| 1.4 | Test real-time refresh | Manual verification |

### Phase 2: Broken Link Recovery (Priority: Medium)

| Step | Task | Files |
|------|------|-------|
| 2.1 | Create affiliate_links table | Database migration |
| 2.2 | Create scan-affiliate-links edge function | `supabase/functions/scan-affiliate-links/index.ts` |
| 2.3 | Create useAffiliateLinks hooks | `src/hooks/useAffiliateLinks.ts` |
| 2.4 | Create BrokenLinkScanner component | `src/components/dashboard/BrokenLinkScanner.tsx` |
| 2.5 | Integrate into Dashboard | `src/pages/Dashboard.tsx` |
| 2.6 | Test with intentionally broken links | Manual verification |

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useLiveRevenue.ts` | Real-time revenue data hook |
| `src/components/dashboard/LiveRevenueFeed.tsx` | Live revenue display card |
| `src/hooks/useAffiliateLinks.ts` | Affiliate link management hooks |
| `src/components/dashboard/BrokenLinkScanner.tsx` | Link health monitoring card |
| `supabase/functions/scan-affiliate-links/index.ts` | Link health check edge function |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Add "Data Hub" tab with LiveRevenueFeed |
| `src/pages/Dashboard.tsx` | Add BrokenLinkScanner card |

### Database Changes

| Change | Description |
|--------|-------------|
| New table: `affiliate_links` | Stores user affiliate links with health status |
| RLS policies | Secure user-only access |

---

## UI/UX Specifications

### Live Revenue Feed Card

```text
+--------------------------------------------------+
|  💰 Live Revenue Feed                    ● LIVE  |
+--------------------------------------------------+
|                                                  |
|  Potential Commission         Actual Commission  |
|  $4,523.80                    $12,847.50        |
|  ▲ Pending + Locked           ▲ Paid            |
|                                                  |
|  Networks: ShareASale ✓  Awin ✓                 |
|                                                  |
|  Last updated: 2 minutes ago     [↻ Refresh]    |
+--------------------------------------------------+
```

### Broken Link Scanner Card

```text
+--------------------------------------------------+
|  🔗 Link Health Monitor              [Scan Now]  |
+--------------------------------------------------+
|                                                  |
|  ✓ 42 Active    ⚠ 3 Broken    ○ 5 Pending      |
|                                                  |
|  ┌──────────────────────────────────────────┐  |
|  │ 🔴 BROKEN: amazon.com/dp/B08XYZ...       │  |
|  │    HTTP 404 - Not Found                   │  |
|  │    Recovery: Use updated ASIN B09ABC...   │  |
|  │    [Replace] [Ignore] [View Details]      │  |
|  └──────────────────────────────────────────┘  |
|                                                  |
|  Last scan: Today at 2:30 PM                    |
+--------------------------------------------------+
```

---

## Security Considerations

1. **Edge Function Authentication**: All edge functions validate JWT tokens
2. **RLS Policies**: Users can only access their own data
3. **Rate Limiting**: Link scanner limits requests to prevent abuse
4. **Input Validation**: All URLs validated before health checks
5. **Timeout Protection**: External requests timeout after 10 seconds

---

## Performance Optimizations

1. **Lazy Loading**: BrokenLinkScanner only fetches data when visible
2. **Background Refresh**: Revenue data refreshes in background
3. **Pagination**: Link scanner processes in batches of 50
4. **Caching**: React Query caches results to reduce API calls
5. **HEAD Requests**: Use HEAD instead of GET for link health checks

---

## Testing Checklist

### Live Revenue Feed
- [ ] Navigate to Settings > Data Hub tab
- [ ] Verify Potential and Actual commission values display
- [ ] Wait 60 seconds, confirm auto-refresh occurs
- [ ] Click manual refresh, verify data updates
- [ ] Verify loading states display correctly

### Broken Link Scanner
- [ ] Add test affiliate links to database
- [ ] Click "Scan Now", verify scan completes
- [ ] Intentionally add a broken link (404 URL)
- [ ] Verify broken link appears with RED highlight
- [ ] Click "Replace Link", verify suggestion applied
- [ ] Verify "Ignore" dismisses the warning

### Header Click Fix (Already Done)
- [ ] Navigate to landing page
- [ ] Click gear icon in header
- [ ] Verify navigation to /settings occurs
- [ ] Test on mobile viewport

