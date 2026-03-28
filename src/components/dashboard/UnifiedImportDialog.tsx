import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const MAX_LINKS = 1000;
const MAX_FIELD_LENGTH = 200;

const TEMPLATE_CSV = `affiliate_url,merchant_name,network,campaign
https://www.shareasale.com/r.cfm?b=123&u=456,Example Merchant,ShareASale,Spring Campaign
https://www.awin1.com/cread.php?awinmid=789,Another Merchant,Awin,`;

const URL_COLUMN_NAMES = ["url", "affiliate_url", "link", "affiliate_link"];
const BRAND_COLUMN_NAMES = ["merchant_name", "brand", "affiliate brand name", "merchant", "brand_name"];

function sanitizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
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

function extractBrandFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const brand = hostname.split(".")[0];
    if (!brand || brand.length < 2) return null;
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch {
    return null;
  }
}

function sanitize(val: unknown): string {
  if (val == null) return "";
  return String(val).trim().slice(0, MAX_FIELD_LENGTH);
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return null;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  brandsAdded: number;
}

interface UnifiedImportDialogProps {
  triggerVariant?: "outline" | "glass";
  triggerLabel?: string;
}

export function UnifiedImportDialog({ triggerVariant = "outline", triggerLabel = "Import Links" }: UnifiedImportDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("paste");
  const [bulkUrls, setBulkUrls] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setProcessing(false);
    setProgress(0);
    setResult(null);
    setBulkUrls("");
    setDragOver(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const syncBrands = async (brandNames: string[]) => {
    if (!user?.id || brandNames.length === 0) return 0;

    const { data: existing } = await supabase
      .from("custom_brands")
      .select("name")
      .eq("user_id", user.id);

    const existingSet = new Set((existing || []).map((b) => b.name.toLowerCase()));
    const newBrands = [...new Set(brandNames.map((n) => n.trim()).filter((n) => n.length > 0))]
      .filter((n) => !existingSet.has(n.toLowerCase()));

    if (newBrands.length > 0) {
      await supabase.from("custom_brands").insert(
        newBrands.map((name) => ({ user_id: user.id, name }))
      );
      queryClient.invalidateQueries({ queryKey: ["custom-brands"] });
    }
    return newBrands.length;
  };

  const processLinks = async (
    links: Array<{ url: string; merchant_name?: string; network?: string; campaign?: string }>
  ) => {
    if (!user?.id) return;
    setProcessing(true);
    setProgress(10);

    try {
      // Sanitize & validate
      const sanitized = links
        .map((l) => ({ ...l, url: sanitizeUrl(l.url) }))
        .filter((l) => isValidUrl(l.url));

      if (sanitized.length === 0) {
        toast.error("No valid URLs found.");
        return;
      }

      const capped = sanitized.slice(0, MAX_LINKS);
      if (sanitized.length > MAX_LINKS) {
        toast.warning(`Only the first ${MAX_LINKS} links will be processed`);
      }

      setProgress(20);

      // Dedup within batch
      const seen = new Set<string>();
      const unique: typeof capped = [];
      for (const link of capped) {
        const key = normalizeUrl(link.url);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(link);
        }
      }

      // Dedup against DB
      const { data: existing } = await supabase
        .from("affiliate_links")
        .select("url")
        .eq("user_id", user.id);

      const existingNormalized = new Set((existing || []).map((l) => normalizeUrl(l.url)));
      const newLinks = unique.filter((l) => !existingNormalized.has(normalizeUrl(l.url)));

      setProgress(40);

      if (newLinks.length === 0) {
        toast.info("No new links to import — all URLs already exist.");
        return;
      }

      // Insert
      const rows = newLinks.map((l) => ({
        user_id: user.id,
        url: l.url,
        merchant_name: l.merchant_name || null,
        network: (l.network || "other").toLowerCase(),
        campaign_source: l.campaign || null,
        status: "active" as const,
      }));

      const { error } = await supabase.from("affiliate_links").insert(rows);
      if (error) throw error;

      setProgress(70);

      // Brand sync
      const brandNames: string[] = [];
      for (const l of newLinks) {
        const brand = l.merchant_name || extractBrandFromUrl(l.url);
        if (brand) brandNames.push(brand);
      }
      const brandsAdded = await syncBrands(brandNames);

      setProgress(100);

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      queryClient.invalidateQueries({ queryKey: ["link-vault"] });

      const duplicates = unique.length - newLinks.length;
      const invalid = links.length - sanitized.length;

      setResult({ imported: newLinks.length, duplicates, invalid, brandsAdded });
      toast.success(`Imported ${newLinks.length} links${brandsAdded > 0 ? ` and updated your Brand list!` : ""}`);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import links");
    } finally {
      setProcessing(false);
    }
  };

  const handlePasteImport = () => {
    const lines = bulkUrls.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    processLinks(lines.map((url) => ({ url })));
  };

  const parseFileData = (rows: Record<string, string>[], headers: string[]) => {
    const urlCol = findColumn(headers, URL_COLUMN_NAMES);
    const brandCol = findColumn(headers, BRAND_COLUMN_NAMES);
    const networkCol = findColumn(headers, ["network"]);
    const campaignCol = findColumn(headers, ["campaign", "campaign_source", "source"]);

    if (!urlCol) {
      toast.error("File must have a URL column (url, affiliate_url, or link)");
      return;
    }

    const links = rows.map((row) => ({
      url: sanitize(row[urlCol]),
      merchant_name: brandCol ? sanitize(row[brandCol]) : undefined,
      network: networkCol ? sanitize(row[networkCol]) : undefined,
      campaign: campaignCol ? sanitize(row[campaignCol]) : undefined,
    }));

    processLinks(links);
  };

  const handleFileUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      if (parsed.data.length === 0) {
        toast.error("CSV file is empty");
        return;
      }
      parseFileData(parsed.data, parsed.meta.fields || []);
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      if (data.length === 0) {
        toast.error("Spreadsheet is empty");
        return;
      }
      const headers = Object.keys(data[0]);
      parseFileData(data, headers);
    } else {
      toast.error("Unsupported file format. Please use .csv or .xlsx");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affhubpro-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-1.5">
          <Upload className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Import Links
          </DialogTitle>
          <DialogDescription>
            Add up to {MAX_LINKS} affiliate links. Brands are automatically extracted and synced.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1">Paste Links</TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">Upload CSV/Excel</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 mt-3">
              <Textarea
                rows={8}
                placeholder={"https://example.com/affiliate/123\nhttps://example.com/affiliate/456\namazon.com/ref/abc"}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="font-mono text-sm"
                disabled={processing}
              />
              <p className="text-xs text-muted-foreground">
                One URL per line. Missing <code>https://</code> will be added automatically.
              </p>
            </TabsContent>

            <TabsContent value="upload" className="space-y-3 mt-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-foreground font-medium">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx supported</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={processing}
                />
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="w-4 h-4" />
                Download CSV template
              </button>
              <p className="text-xs text-muted-foreground">
                Columns: <code>affiliate_url</code> (required), <code>merchant_name</code>, <code>network</code>, <code>campaign</code>
              </p>
            </TabsContent>

            {processing && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </Tabs>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <CheckCircle2 className="w-6 h-6 text-success mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Import Complete</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  <li>✓ {result.imported} link{result.imported !== 1 ? "s" : ""} imported</li>
                  {result.brandsAdded > 0 && (
                    <li>✓ {result.brandsAdded} new brand{result.brandsAdded !== 1 ? "s" : ""} added</li>
                  )}
                  {result.duplicates > 0 && (
                    <li>⊘ {result.duplicates} duplicate{result.duplicates !== 1 ? "s" : ""} skipped</li>
                  )}
                  {result.invalid > 0 && (
                    <li>✗ {result.invalid} invalid URL{result.invalid !== 1 ? "s" : ""}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button variant="hero" onClick={() => { setOpen(false); resetState(); }}>
              Done
            </Button>
          ) : tab === "paste" ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handlePasteImport}
                disabled={processing || !bulkUrls.trim()}
              >
                {processing ? "Importing..." : "Import Links"}
              </Button>
            </>
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
