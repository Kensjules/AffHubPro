import { DollarSign, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveRevenue } from "@/hooks/useLiveRevenue";
import { useShareASaleAccount } from "@/hooks/useShareASale";
import { useAwinIntegration } from "@/hooks/useAwinIntegration";
import { formatDistanceToNow } from "date-fns";

export function LiveRevenueFeed() {
  const { data, isLoading, isRefetching, refetch, error } = useLiveRevenue();
  const { data: shareASaleAccount, isLoading: sasLoading } = useShareASaleAccount();
  const { integration: awinIntegration, isLoading: awinLoading } = useAwinIntegration();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const lastUpdatedText = data?.lastUpdated
    ? formatDistanceToNow(data.lastUpdated, { addSuffix: true })
    : "Never";

  if (error) {
    return (
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Live Revenue Feed</h3>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">Failed to load revenue data</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Live Revenue Feed</h3>
            <p className="text-xs text-muted-foreground">Real-time commission tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">LIVE</span>
          </div>
        </div>
      </div>

      {/* Commission Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <Skeleton className="w-24 h-4 mb-2" />
            <Skeleton className="w-32 h-8" />
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <Skeleton className="w-24 h-4 mb-2" />
            <Skeleton className="w-32 h-8" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Potential Commission */}
          <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground">Potential Commission</p>
            </div>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(data?.potentialCommission || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pending + Locked</p>
          </div>

          {/* Actual Commission */}
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Actual Commission</p>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(data?.actualCommission || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Paid</p>
          </div>
        </div>
      )}

      {/* Network Status */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
        <span className="text-xs text-muted-foreground">Networks:</span>
        {sasLoading || awinLoading ? (
          <Skeleton className="w-32 h-4" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  shareASaleAccount?.is_connected ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              <span className="text-xs text-muted-foreground">ShareASale</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  awinIntegration?.is_connected ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              <span className="text-xs text-muted-foreground">Awin</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Updated {lastUpdatedText} • {data?.transactionCount || 0} transactions
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-7 px-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
