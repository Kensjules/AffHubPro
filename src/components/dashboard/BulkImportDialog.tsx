import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
}

const MAX_ROWS = 500;
const MAX_FIELD_LENGTH = 200;

const TEMPLATE_CSV = `affiliate_url,merchant_name,network,campaign
https://www.shareasale.com/r.cfm?b=123&u=456,Example Merchant,ShareASale,Spring Campaign
https://www.awin1.com/cread.php?awinmid=789,Another Merchant,Awin,`;

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hostname = u.hostname.toLowerCase();
    let path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.hostname}${path}${u.search}${u.hash}`;
  } catch {
    return raw.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function sanitize(val: unknown): string {
  if (val == null) return "";
  return String(val).trim().slice(0, MAX_FIELD_LENGTH);
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function BulkImportDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetState = useCallback(() => {
    setProcessing(false);
    setProgress(0);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affhubpro-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setProcessing(true);
    setProgress(5);
    setResult(null);

    try {
      // Parse CSV
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        toast.error("Failed to parse CSV: " + parsed.errors[0].message);
        setProcessing(false);
        return;
      }

      // Validate header
      const headers = parsed.meta.fields?.map((f) => f.toLowerCase()) || [];
      if (!headers.includes("affiliate_url")) {
        toast.error("CSV must have an 'affiliate_url' column");
        setProcessing(false);
        return;
      }

      let rows = parsed.data;
      if (rows.length === 0) {
        toast.error("CSV file is empty");
        setProcessing(false);
        return;
      }

      if (rows.length > MAX_ROWS) {
        toast.warning(`Only the first ${MAX_ROWS} rows will be processed`);
        rows = rows.slice(0, MAX_ROWS);
      }

      setProgress(15);

      // Fetch existing links for dedup
      const { data: existing } = await supabase
        .from("affiliate_links")
        .select("url")
        .eq("user_id", user.id);

      const existingNormalized = new Set(
        (existing || []).map((l) => normalizeUrl(l.url))
      );

      setProgress(25);

      // Process rows
      const toInsert: Array<{
        user_id: string;
        url: string;
        merchant_name: string | null;
        network: string;
        campaign_source: string | null;
        status: string;
      }> = [];
      const seenInBatch = new Set<string>();
      let duplicates = 0;
      let invalid = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawUrl = (row["affiliate_url"] || "").trim();

        if (!rawUrl) {
          invalid++;
          errors.push(`Row ${i + 2}: missing affiliate_url`);
          continue;
        }

        if (!isValidUrl(rawUrl)) {
          invalid++;
          errors.push(`Row ${i + 2}: invalid URL`);
          continue;
        }

        const normalized = normalizeUrl(rawUrl);

        if (existingNormalized.has(normalized) || seenInBatch.has(normalized)) {
          duplicates++;
          continue;
        }

        seenInBatch.add(normalized);

        const merchantName = sanitize(row["merchant_name"]);
        const network = sanitize(row["network"]).toLowerCase() || "other";
        const campaign = sanitize(row["campaign"]);

        toInsert.push({
          user_id: user.id,
          url: rawUrl,
          merchant_name: merchantName || null,
          network,
          campaign_source: campaign || null,
          status: "active",
        });
      }

      setProgress(50);

      // Batch insert
      let imported = 0;
      if (toInsert.length > 0) {
        const { error, data } = await supabase
          .from("affiliate_links")
          .insert(toInsert)
          .select("id, url");

        if (error) {
          toast.error("Database insert failed: " + error.message);
          setProcessing(false);
          return;
        }

        imported = data?.length || toInsert.length;
        setProgress(75);

        // Invalidate queries immediately so table refreshes
        queryClient.invalidateQueries({ queryKey: ["link-vault"] });
        queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
        queryClient.invalidateQueries({ queryKey: ["link-stats"] });

        // Fire auto-scans in background (throttled)
        if (data && data.length > 0) {
          (async () => {
            for (const link of data) {
              try {
                await supabase.functions.invoke("scan-link", {
                  body: { url: link.url, linkId: link.id },
                });
              } catch {
                // Non-critical — scan can be done manually later
              }
              await new Promise((r) => setTimeout(r, 200));
            }
            queryClient.invalidateQueries({ queryKey: ["link-vault"] });
          })();
        }
      }

      setProgress(100);
      setResult({ imported, duplicates, invalid, errors: errors.slice(0, 10) });
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Import failed — please check your file and try again");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="glass" size="sm" className="gap-1.5">
          <Upload className="w-4 h-4" />
          Bulk Import
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Bulk CSV Import
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with up to {MAX_ROWS} affiliate links. Links will be
            automatically scanned after import.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            {/* Template download */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Download className="w-4 h-4" />
              Download CSV template
            </button>

            {/* File input */}
            <div className="space-y-2">
              <label
                htmlFor="csv-upload"
                className="block text-sm font-medium text-foreground"
              >
                Select CSV file
              </label>
              <input
                ref={fileRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={processing}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
              />
            </div>

            {/* Progress */}
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Required format hint */}
            <p className="text-xs text-muted-foreground">
              Required column: <code className="text-foreground">affiliate_url</code>.
              Optional: <code className="text-foreground">merchant_name</code>,{" "}
              <code className="text-foreground">network</code>,{" "}
              <code className="text-foreground">campaign</code>.
            </p>
          </div>
        ) : (
          /* Success Report */
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <CheckCircle2 className="w-6 h-6 text-success mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Import Complete</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  <li>✓ {result.imported} link{result.imported !== 1 ? "s" : ""} imported</li>
                  {result.duplicates > 0 && (
                    <li>⊘ {result.duplicates} duplicate{result.duplicates !== 1 ? "s" : ""} skipped</li>
                  )}
                  {result.invalid > 0 && (
                    <li>✗ {result.invalid} invalid row{result.invalid !== 1 ? "s" : ""}</li>
                  )}
                </ul>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Issues</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.imported > 0 && (
              <p className="text-xs text-muted-foreground">
                Revenue Bodyguard is scanning your new links in the background.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button variant="hero" onClick={() => { setOpen(false); resetState(); }}>
              Done
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={processing}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
