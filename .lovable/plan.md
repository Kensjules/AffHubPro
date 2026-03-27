

# Universal Affiliate Tracking — Copy Overhaul

## Files Modified

| File | Changes |
|---|---|
| `src/components/landing/HeroSection.tsx` | Hero subtitle, badge text, social proof chips |
| `src/components/landing/FeaturesSection.tsx` | Last feature card (network-specific → universal), section subtitle |
| `src/components/landing/HowItWorksSection.tsx` | Step 02 title & description (ShareASale-specific → universal) |
| `src/components/landing/CTASection.tsx` | Subtitle copy |
| `src/components/landing/Footer.tsx` | Disclaimer text, brand name fix (AffHubHQ → AffHubPro) |

## Exact Copy Changes

### HeroSection.tsx
- **Badge** (line 22): `"Enterprise-Grade Affiliate Management"` → `"Your Universal Affiliate Dashboard"`
- **Subtitle** (line 40): `"Track your ShareASale & Awin performance with crystal-clear analytics. See your earnings, clicks, and best products in one beautiful dashboard."` → `"One dashboard for all your affiliate partnerships — networks, direct brands, and individual links. See every earning, click, and conversion in one place."`
- **Social proof chips** (lines 59-61):
  - `"✓ ShareASale/Awin Integration Live"` → `"✓ Works With Any Affiliate Source"`
  - `"✓ Real-Time Data Sync"` → `"✓ Universal CSV Import"`
  - `"✓ Built for Affiliate Marketers"` → `"✓ Networks, Brands & Direct Links"`

### FeaturesSection.tsx
- **Section subtitle** (line 47): `"Powerful features designed specifically for affiliate marketers who want clarity without complexity."` → `"Powerful features for affiliate marketers who need one source of truth — no matter where revenue comes from."`
- **Last feature card** (lines 30-33):
  - Title: `"ShareASale & Awin Specialist"` → `"Universal Data Import"`
  - Description: `"Deep integration with ShareASale (part of the Awin Group) is live now. More networks coming in V2 based on user demand."` → `"Import data from ShareASale, Impact, direct brand partnerships, or any affiliate source via CSV. One format, every revenue stream."`

### HowItWorksSection.tsx
- **Step 02** (lines 11-14):
  - Title: `"Connect ShareASale"` → `"Import Your Data"`
  - Description: `"Enter your ShareASale API credentials. We'll validate them instantly and start syncing."` → `"Connect a network via API or import any affiliate data with CSV. We support ShareASale, Awin, Impact, and direct brand exports."`

### CTASection.tsx
- **Subtitle** (line 24): `"Join thousands of affiliate marketers who've simplified their analytics with AffHubPro."` → `"Consolidate every affiliate partnership — networks, brands, and direct links — into one clear view."`

### Footer.tsx
- **Brand name** (line 13): `Aff<span>Hub</span>HQ` → `Aff<span>Hub</span>Pro` (consistency fix)
- **Disclaimer** (line 31): `"AffHubPro is an independent tool and is not officially affiliated with ShareASale or Awin."` → `"AffHubPro is an independent analytics platform. Not affiliated with any affiliate network."`

