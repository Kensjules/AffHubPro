import { useState } from "react";
import { 
  Link2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Replace,
  EyeOff,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useBrokenLinks,
  useLinkStats,
  useScanLinks,
  useReplaceLink,
  useIgnoreLink,
  useAddAffiliateLink,
  type AffiliateLink,
} from "@/hooks/useAffiliateLinks";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function BrokenLinkScanner() {
  const { data: brokenLinks, isLoading: linksLoading } = useBrokenLinks();
  const { data: stats, isLoading: statsLoading } = useLinkStats();
  const { mutate: scanLinks, isPending: scanning } = useScanLinks();
  const { mutate: replaceLink, isPending: replacing } = useReplaceLink();
  const { mutate: ignoreLink, isPending: ignoring } = useIgnoreLink();
  const { mutate: addLink, isPending: adding } = useAddAffiliateLink();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newNetwork, setNewNetwork] = useState<"shareasale" | "awin" | "other">("shareasale");

  const handleAddLink = () => {
    if (!newUrl.trim()) return;
    addLink(
      { url: newUrl.trim(), merchant_name: newMerchant.trim() || undefined, network: newNetwork },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setNewUrl("");
          setNewMerchant("");
          setNewNetwork("shareasale");
        },
      }
    );
  };

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const isLoading = linksLoading || statsLoading;

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Link Health Monitor</h3>
            <p className="text-xs text-muted-foreground">Scan and recover broken affiliate links</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Affiliate Link</DialogTitle>
                <DialogDescription>
                  Add a new affiliate link to monitor for health status.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://www.shareasale.com/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant Name (Optional)</Label>
                  <Input
                    id="merchant"
                    placeholder="Amazon, Target, etc."
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Select value={newNetwork} onValueChange={(v) => setNewNetwork(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shareasale">ShareASale</SelectItem>
                      <SelectItem value="awin">Awin</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleAddLink} disabled={adding || !newUrl.trim()}>
                  {adding ? "Adding..." : "Add Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="hero" size="sm" onClick={() => scanLinks()} disabled={scanning}>
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Scan Now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-24 h-6" />
        </div>
      ) : (
        <div className="flex items-center gap-6 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats?.active || 0}</span> Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-destructive">{stats?.broken || 0}</span> Broken
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats?.ignored || 0}</span> Ignored
            </span>
          </div>
        </div>
      )}

      {/* Broken Links List */}
      {linksLoading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-20 rounded-lg" />
          <Skeleton className="w-full h-20 rounded-lg" />
        </div>
      ) : brokenLinks && brokenLinks.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Broken Links Requiring Attention</h4>
          {brokenLinks.map((link) => (
            <BrokenLinkItem
              key={link.id}
              link={link}
              onReplace={(newUrl) => replaceLink({ linkId: link.id, newUrl })}
              onIgnore={() => ignoreLink(link.id)}
              isReplacing={replacing}
              isIgnoring={ignoring}
              truncateUrl={truncateUrl}
            />
          ))}
        </div>
      ) : stats?.total === 0 ? (
        <div className="text-center py-8">
          <Link2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No affiliate links added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add links to start monitoring their health
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success/50 mb-3" />
          <p className="text-muted-foreground">All links are healthy!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No broken links detected in your {stats?.total || 0} monitored links
          </p>
        </div>
      )}
    </div>
  );
}

interface BrokenLinkItemProps {
  link: AffiliateLink;
  onReplace: (newUrl: string) => void;
  onIgnore: () => void;
  isReplacing: boolean;
  isIgnoring: boolean;
  truncateUrl: (url: string, maxLength?: number) => string;
}

function BrokenLinkItem({
  link,
  onReplace,
  onIgnore,
  isReplacing,
  isIgnoring,
  truncateUrl,
}: BrokenLinkItemProps) {
  const lastChecked = link.last_checked_at
    ? formatDistanceToNow(new Date(link.last_checked_at), { addSuffix: true })
    : "Never";

  return (
    <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-sm font-medium text-destructive">BROKEN</span>
            {link.http_status_code && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                HTTP {link.http_status_code}
              </span>
            )}
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground hover:underline flex items-center gap-1 mb-1"
          >
            {truncateUrl(link.url)}
            <ExternalLink className="w-3 h-3" />
          </a>
          {link.merchant_name && (
            <p className="text-xs text-muted-foreground">Merchant: {link.merchant_name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Checked {lastChecked}</p>

          {link.recovery_suggestion && (
            <div className="mt-3 p-2 rounded bg-success/10 border border-success/20">
              <p className="text-xs text-success font-medium mb-1">Recovery Suggestion:</p>
              <p className="text-xs text-muted-foreground">{truncateUrl(link.recovery_suggestion, 60)}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {link.recovery_suggestion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReplace(link.recovery_suggestion!)}
              disabled={isReplacing}
              className="text-success hover:text-success"
            >
              <Replace className="w-3.5 h-3.5" />
              Replace
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onIgnore}
            disabled={isIgnoring}
            className="text-muted-foreground"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Ignore
          </Button>
        </div>
      </div>
    </div>
  );
}
