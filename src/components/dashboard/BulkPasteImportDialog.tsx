import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return (parsed.hostname.toLowerCase() + parsed.pathname.replace(/\/+$/, "") + parsed.search).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function BulkPasteImportDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!user?.id || !bulkUrls.trim()) return;
    setImporting(true);

    try {
      const urls = bulkUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0 && isValidUrl(u));

      if (urls.length === 0) {
        toast.error("No valid URLs found. Each line must be an http:// or https:// URL.");
        setImporting(false);
        return;
      }

      // Dedup within batch
      const seen = new Set<string>();
      const uniqueUrls: string[] = [];
      for (const url of urls) {
        const key = normalizeUrl(url);
        if (!seen.has(key)) {
          seen.add(key);
          uniqueUrls.push(url);
        }
      }

      // Fetch existing for dedup
      const { data: existing } = await supabase
        .from("affiliate_links")
        .select("url")
        .eq("user_id", user.id);

      const existingNormalized = new Set(
        (existing || []).map((l) => normalizeUrl(l.url))
      );

      const newUrls = uniqueUrls.filter(
        (u) => !existingNormalized.has(normalizeUrl(u))
      );

      if (newUrls.length === 0) {
        toast.info("No new links to import — all URLs already exist.");
        setImporting(false);
        return;
      }

      const rows = newUrls.map((url) => ({
        user_id: user.id,
        url,
        network: "other" as const,
        status: "active" as const,
      }));

      const { error } = await supabase.from("affiliate_links").insert(rows);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });

      toast.success(`Imported ${newUrls.length} links`);
      setOpen(false);
      setBulkUrls("");
    } catch (err) {
      console.error("Bulk import error:", err);
      toast.error("Failed to import links");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setBulkUrls(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Import Links</DialogTitle>
          <DialogDescription>
            Paste one URL per line. Duplicates will be skipped automatically.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          placeholder={"https://example.com/affiliate/123\nhttps://example.com/affiliate/456"}
          value={bulkUrls}
          onChange={(e) => setBulkUrls(e.target.value)}
          className="font-mono text-sm"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={handleImport}
            disabled={importing || !bulkUrls.trim()}
          >
            {importing ? "Importing..." : "Import Links"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
