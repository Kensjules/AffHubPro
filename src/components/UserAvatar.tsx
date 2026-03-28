import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { Camera, Loader2 } from "lucide-react";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-20 w-20",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 200;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to compress image"))),
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function UserAvatar({ size = "md", editable = false, className }: UserAvatarProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(displayName);
  const avatarUrl = (profile as any)?.avatar_url as string | null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    setUploading(true);
    try {
      const resized = await resizeImage(file);
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, resized, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Append cache-buster so the browser fetches the new image
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile picture updated!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload photo: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative group", editable && "cursor-pointer", className)}>
      <Avatar
        className={cn(sizeClasses[size], "border border-primary/20", editable && "cursor-pointer")}
        onClick={() => editable && fileInputRef.current?.click()}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", textSizeClasses[size])}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      {editable && !uploading && (
        <div
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Loading spinner */}
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}
    </div>
  );
}
