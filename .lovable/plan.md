

# Revenue Chart Tooltip Fix & Cleanup

## Overview
Three items: (1) fix the chart tooltip to only activate on data point hover with no crosshair, (2) GitHub sync is automatic via Lovable's integration, (3) landing page verification requires publishing.

## 1. Chart Tooltip Fix — `src/components/dashboard/RevenueChart.tsx`

Add props to the `<ChartTooltip>` component to restrict tooltip behavior:

```tsx
<ChartTooltip 
  cursor={false}
  isAnimationActive={false}
  content={
    <ChartTooltipContent 
      formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
    />
  }
/>
```

Also add `activeDot` to the `<Area>` and disable default dot hover behavior:

```tsx
<Area
  type="monotone"
  dataKey="earnings"
  stroke="hsl(var(--primary))"
  strokeWidth={2}
  fill="url(#revenueGradient)"
  activeDot={{ r: 5, strokeWidth: 2 }}
  dot={false}
/>
```

- `cursor={false}` removes the vertical crosshair line
- `activeDot` makes the tooltip snap to data points with a visible dot indicator
- Recharts' `Tooltip` with `cursor={false}` still activates on nearest-point proximity, which is the desired "snap to data point" behavior

## 2. GitHub Sync
Lovable automatically pushes all changes to the connected GitHub repository. No manual bundling is needed — all recent changes (avatar upload, initials logic, safety guards, link monitor, landing page copy) are already committed. If not connected, the user can connect via Project Settings → GitHub.

## 3. Landing Page Verification
The landing page copy update for "Automated Link Protection" is in the codebase (`FeaturesSection.tsx`). To make it live at `trans-a-lyze.lovable.app`, the user needs to click **Publish → Update** in the editor. The preview URL already reflects the changes.

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/RevenueChart.tsx` | Add `cursor={false}` to tooltip, `activeDot`/`dot={false}` to Area |

