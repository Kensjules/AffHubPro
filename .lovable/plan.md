

# User Identity, Safety Guards & Landing Page Update

## Overview
Three workstreams: (1) improve avatar initials logic and add profile picture upload, (2) enhance the "Clear Broken Links" confirmation modal copy, (3) update landing page features copy.

## 1. Avatar Initials Logic

**File: `src/components/dashboard/DashboardSidebar.tsx`**

Current logic: `displayName.slice(0, 2).toUpperCase()` — takes first 2 chars of display name.

New logic: Split `displayName` by space. If two+ words, use first char of first word + first char of last word. If single word, use first 2 chars. This gives "JB" for "Jules Bierman" instead of "JU".

Extract this into a shared utility (`src/lib/utils.ts`) so it can be reused anywhere avatars appear.

## 2. Profile Picture Upload

### Database
- Add `avatar_url` column to `profiles` table (text, nullable)

### Storage
- Create `avatars` storage bucket (public) with RLS policy allowing authenticated users to upload/delete their own files (path pattern: `{user_id}/*`)

### Shared Avatar Component
**New file: `src/components/UserAvatar.tsx`**
- Accepts `size`, `className`, optional `editable` prop
- Reads profile `avatar_url` from `useProfile` hook
- Shows `AvatarImage` if `avatar_url` exists, falls back to initials
- When `editable=true`: clicking opens a hidden file input (`.jpg,.png,.webp`)
- Client-side processing: use `canvas` API to resize to 200x200, crop to square, compress to JPEG ~80% quality (keeps under 200KB)
- Upload to `avatars/{user_id}/avatar.jpg` in storage bucket
- Update `profiles.avatar_url` with the public URL
- Shows a loading spinner overlay during upload
- Toast on success/error

### Integration Points
- **DashboardSidebar**: Replace inline Avatar with `<UserAvatar size="sm" />`
- **Settings page**: Replace avatar section with `<UserAvatar size="lg" editable />`

### Profile hook update
**File: `src/hooks/useProfile.ts`**
- Add `avatar_url` to the `Profile` interface

## 3. Clear Broken Links — Enhanced Modal Copy

**File: `src/components/dashboard/BrokenLinkScanner.tsx`** (lines 228-244)

The AlertDialog already exists. Update the copy to match the spec exactly:
- Title: `"Remove Broken Links"`
- Description: `"Are you sure you want to remove all [X] broken links? This action cannot be undone."`
- Confirm button: `"Confirm Delete"` (keep destructive styling)
- Cancel button remains

This is a minor text change — no structural change needed.

## 4. Landing Page Features Update

**File: `src/components/landing/FeaturesSection.tsx`**

Replace three of the six feature cards with new enterprise-focused copy:

| Replace | New Title | New Description |
|---|---|---|
| "Bank-level Security" → | **Automated Link Protection** | "Real-time scanning detects broken or hijacked affiliate links before they cost you commissions. Protect every click, automatically." |
| "Auto-sync" → | **Universal Brand Sync** | "Import a spreadsheet and watch your brand list build itself. The platform learns your business partners instantly — no manual entry required." |
| "Export Anywhere" → | **Personalized Dashboard** | "Custom profile, managed brand list, and tailored analytics. Your dashboard adapts to your business, not the other way around." |

Update icons: Shield stays for Link Protection, RefreshCw → Upload for Brand Sync, Download → User for Personalized Dashboard.

## Technical Details

### Canvas-based image resize (in UserAvatar)
```typescript
const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 200;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
};
```

### Storage bucket migration
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

## Files Modified

| File | Action |
|---|---|
| Migration | Add `avatar_url` to profiles, create `avatars` bucket + RLS |
| `src/lib/utils.ts` | Add `getInitials(displayName)` utility |
| `src/components/UserAvatar.tsx` | New — shared avatar with upload capability |
| `src/hooks/useProfile.ts` | Add `avatar_url` to Profile interface |
| `src/components/dashboard/DashboardSidebar.tsx` | Use `UserAvatar` + new initials logic |
| `src/pages/Settings.tsx` | Use `UserAvatar` with editable prop |
| `src/components/dashboard/BrokenLinkScanner.tsx` | Update modal copy text |
| `src/components/landing/FeaturesSection.tsx` | Update 3 feature cards with new copy + icons |

