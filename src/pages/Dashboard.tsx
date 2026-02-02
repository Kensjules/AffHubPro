import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  Clock, 
  Store,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardMetrics, useEarningsChart } from "@/hooks/useDashboardMetrics";
import { useRecentTransactions } from "@/hooks/useTransactions";
import { useSyncShareASale, useShareASaleAccount } from "@/hooks/useShareASale";
import { formatDistanceToNow } from "date-fns";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: chartData, isLoading: chartLoading } = useEarningsChart();
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: shareASaleAccount } = useShareASaleAccount();
  const { mutate: syncShareASale, isPending: syncing } = useSyncShareASale();

  const handleSync = () => {
    syncShareASale();
  };

  const lastSyncText = shareASaleAccount?.last_sync_at 
    ? formatDistanceToNow(new Date(shareASaleAccount.last_sync_at), { addSuffix: true })
    : "Never";

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  // TEMP: Disable onboarding redirect for debugging - remove after testing complete
  // Gate: Require ShareASale connection
  // if (!shareASaleAccount?.is_connected) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="glass rounded-xl p-8 max-w-md text-center space-y-4 animate-fade-in">
  //         <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
  //           <AlertCircle className="w-8 h-8 text-primary" />
  //         </div>
  //         <h2 className="text-xl font-display font-semibold text-foreground">Connect ShareASale</h2>
  //         <p className="text-muted-foreground">You need to connect your ShareASale account to view your dashboard.</p>
  //         <Button variant="hero" onClick={() => navigate("/onboarding")}>
  //           Connect Now
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content - offset by sidebar width */}
      <main className="ml-16 lg:ml-64 p-6 lg:p-8 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {profileLoading ? (
              <>
                <Skeleton className="w-64 h-8 mb-2" />
                <Skeleton className="w-40 h-4" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Welcome back, <span className="gradient-text">{displayName}</span>
                </h1>
                <p className="text-muted-foreground mt-1">Here's what's happening with your affiliate business.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Last sync: {lastSyncText}</span>
            </div>
            <Button 
              variant="hero" 
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metricsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="w-24 h-8 mb-1" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))
          ) : (
            <>
              <StatsCard
                title="Total Revenue"
                value={`$${(metrics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={DollarSign}
                highlight
                trend={metrics ? {
                  value: `${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange}%`,
                  positive: metrics.revenueChange >= 0
                } : undefined}
              />
              <StatsCard
                title="Pending Payouts"
                value={`$${(metrics?.pendingPayouts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Clock}
                trend={metrics ? {
                  value: `${metrics.pendingChange >= 0 ? '+' : ''}${metrics.pendingChange}%`,
                  positive: metrics.pendingChange >= 0
                } : undefined}
              />
              <StatsCard
                title="Active Stores"
                value={`${metrics?.activeStores || 0}`}
                icon={Store}
                trend={metrics ? {
                  value: `${metrics.storesChange >= 0 ? '+' : ''}${metrics.storesChange}%`,
                  positive: metrics.storesChange >= 0
                } : undefined}
              />
            </>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart data={chartData} isLoading={chartLoading} />
        </div>

        {/* Recent Transactions */}
        <RecentTransactionsTable 
          transactions={recentTransactions} 
          isLoading={transactionsLoading} 
        />
      </main>
    </div>
  );
}
