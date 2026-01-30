
# Plan: Create New Integrations Page with Awin Card

## Overview
Create a dedicated Integrations page (`/integrations`) that displays affiliate network integrations. The page will feature an Awin/ShareASale integration card with a disabled "Sync Account" toggle and a "Coming Soon" tooltip to indicate the automated API is in development.

## Implementation Details

### 1. Create the Integrations Page
**File: `src/pages/Integrations.tsx`**

The page will follow the existing dashboard layout pattern:
- Use `DashboardSidebar` for consistent navigation
- Include responsive padding (`ml-16 lg:ml-64`)
- Apply the glass card styling consistent with Settings page

**Page structure:**
- Page header: "Integrations" title with subtitle
- Integration cards section displaying available networks
- Awin card with logo, description, toggle switch, and tooltip

### 2. Add Awin/ShareASale Integration Card

The card will include:
- **Awin Logo**: An inline SVG of the official Awin logo (teal/turquoise brand color)
- **ShareASale mention**: Text indicating "Awin / ShareASale" since ShareASale is owned by Awin
- **Description**: Brief text about what this integration will enable
- **Toggle Switch**: Disabled switch labeled "Sync Account"
- **Coming Soon Tooltip**: Hovering over the toggle shows "Coming Soon - We're building automated API sync"

### 3. Add Route to App.tsx
Add a protected route for `/integrations` pointing to the new page.

### 4. Add Navigation Link to Sidebar
**File: `src/components/dashboard/DashboardSidebar.tsx`**

Add "Integrations" item to the navigation with a `Plug` or `Link2` icon, positioned after "Reports" in the nav list.

## Technical Approach

### Components Used
- `Switch` from `@/components/ui/switch` (already exists)
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip` (already exists)
- `DashboardSidebar` for layout consistency
- Lucide icons: `Plug` for nav item

### Styling
- Glass card effect (`.glass rounded-xl p-6`)
- Consistent dark navy/gold theme
- Disabled toggle with reduced opacity
- Tooltip styled with the existing popover styles

## Files to Create/Modify
1. **Create**: `src/pages/Integrations.tsx` - New integrations page
2. **Modify**: `src/App.tsx` - Add `/integrations` route
3. **Modify**: `src/components/dashboard/DashboardSidebar.tsx` - Add nav item

## Visual Preview

```text
+------------------------------------------+
|  Integrations                            |
|  Connect your affiliate networks         |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |  [Awin Logo]                       |  |
|  |  Awin / ShareASale                 |  |
|  |  Sync your affiliate data          |  |
|  |  automatically                     |  |
|  |                                    |  |
|  |  Sync Account  [ OFF ] (i)         |  |
|  |                 ^                  |  |
|  |          "Coming Soon" tooltip     |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```
