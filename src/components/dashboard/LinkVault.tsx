import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Link2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Network = "Awin" | "ShareASale" | "Other";

interface AffiliateLink {
  id: string;
  url: string;
  merchant_name: string | null;
  network: string;
  campaign_source: string | null;
  status: string;
  created_at: string;
}

interface ScanResult {
  status: "active" | "error" | "unknown";
  httpCode: number;
  responseTime: number;
  finalUrl: string;
  error?: string;
}

export function LinkVault() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [url, setUrl] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [network, setNetwork] = useState<Network>("ShareASale");
  const [campaignSource, setCampaignSource] = useState("");

  // Scanning state
  const [scanningLinkId, setScanningLinkId] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<Record<string, number>>({});

  // Fetch links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["link-vault", user?.id],
    queryFn: async (): Promise<AffiliateLink[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, url, merchant_name, network, campaign_source, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        throw error;
      }

      return (data || []) as AffiliateLink[];
    },
    enabled: !!user?.id,
  });

  // Add link mutation
  const addLinkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          url: url.trim(),
          merchant_name: merchantName.trim(),
          network: network.toLowerCase(),
          campaign_source: campaignSource.trim() || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-vault"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success("Affiliate link added successfully!");
      // Clear form
      setUrl("");
      setMerchantName("");
      setNetwork("ShareASale");
      setCampaignSource("");
    },
    onError: (error) => {
      console.error("Error adding link:", error);
      toast.error("Failed to add link. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    if (!merchantName.trim()) {
      toast.error("Merchant name is required");
      return;
    }

    addLinkMutation.mutate();
  };

  const handleScanLink = async (linkId: string, url: string) => {
    // Check cooldown (5 seconds)
    if (lastScanned[linkId] && Date.now() - lastScanned[linkId] < 5000) {
      const remaining = Math.ceil((5000 - (Date.now() - lastScanned[linkId])) / 1000);
      toast.warning(`Please wait ${remaining}s before scanning again`);
      return;
    }

    // Set scanning state
    setScanningLinkId(linkId);

    try {
      // Call Edge Function with linkId for alert detection
      const { data, error } = await supabase.functions.invoke<ScanResult>("scan-link", {
        body: { url, linkId },
      });

      if (error) throw error;

      if (!data) {
        throw new Error("No response from scan");
      }

      // Map scan result to database status
      const dbStatus = data.status === "active" ? "active" : data.status === "error" ? "broken" : "error";

      // Update database with result
      await supabase
        .from("affiliate_links")
        .update({ 
          status: dbStatus,
          http_status_code: data.httpCode,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", linkId);

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["link-vault"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });

      // Show success toast
      if (data.status === "active") {
        toast.success(`✓ Link active (${data.httpCode}) - ${data.responseTime}ms`);
      } else {
        toast.error(`✗ Link ${data.status} (${data.httpCode || "timeout"})`);
      }

      // Update cooldown
      setLastScanned((prev) => ({ ...prev, [linkId]: Date.now() }));
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("Scan failed - please try again");
    } finally {
      setScanningLinkId(null);
    }
  };

  const getStatusBadge = (status: string, isScanning: boolean = false) => {
    if (isScanning) {
      return (
        <Badge className="bg-primary/10 text-primary border border-primary/20 animate-pulse">
          Scanning...
        </Badge>
      );
    }
    
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/10 text-success border border-success/20 hover:bg-success/20">
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20">
            Paused
          </Badge>
        );
      case "error":
      case "broken":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatNetwork = (network: string) => {
    const networkMap: Record<string, string> = {
      awin: "Awin",
      shareasale: "ShareASale",
      other: "Other",
    };
    return networkMap[network.toLowerCase()] || network;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Link Vault
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Store and manage your affiliate links in one place. Track performance and detect broken links.
        </p>
      </div>

      {/* Quick-Add Form */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Add New Link</CardTitle>
          <CardDescription>
            Add an affiliate link to track its performance and health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">Affiliate URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.shareasale.com/r.cfm?..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-card border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantName">Merchant Name *</Label>
                <Input
                  id="merchantName"
                  type="text"
                  placeholder="e.g., Amazon, Bluehost"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="bg-card border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <Select value={network} onValueChange={(v) => setNetwork(v as Network)}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Awin">Awin</SelectItem>
                    <SelectItem value="ShareASale">ShareASale</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignSource">Campaign / Source (Optional)</Label>
                <Input
                  id="campaignSource"
                  type="text"
                  placeholder="e.g., Facebook Ads Q1"
                  value={campaignSource}
                  onChange={(e) => setCampaignSource(e.target.value)}
                  className="bg-card border-border"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              disabled={addLinkMutation.isPending}
              className="w-full md:w-auto"
            >
              {addLinkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Link
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Links Table */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Your Links</CardTitle>
          <CardDescription>
            {links.length} link{links.length !== 1 ? "s" : ""} tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No links yet.</p>
              <p className="text-sm">Add your first affiliate link above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="min-w-[600px] px-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Merchant</TableHead>
                      <TableHead className="text-muted-foreground">Network</TableHead>
                      <TableHead className="text-muted-foreground">Source</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link, index) => (
                      <TableRow
                        key={link.id}
                        className={`border-border/50 ${
                          index % 2 === 0 ? "bg-muted/20" : ""
                        } hover:bg-muted/40 transition-colors`}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{link.merchant_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {link.url}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatNetwork(link.network)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {link.campaign_source || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(link.status, scanningLinkId === link.id)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleScanLink(link.id, link.url)}
                            disabled={scanningLinkId === link.id}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {scanningLinkId === link.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                            {scanningLinkId === link.id ? "Scanning" : "Scan"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
