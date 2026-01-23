import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  DollarSign, 
  MousePointerClick, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  LogOut,
  Calendar,
  ChevronDown,
  AlertCircle,
  Moon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardMetrics, useEarningsChart } from "@/hooks/useDashboardMetrics";
import { useRecentTransactions } from "@/hooks/useTransactions";
import { useSyncShareASale, useShareASaleAccount } from "@/hooks/useShareASale";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: chartData, isLoading: chartLoading } = useEarningsChart();
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: shareASaleAccount } = useShareASaleAccount();
  const { mutate: syncShareASale, isPending: syncing } = useSyncShareASale();

  const handleSync = () => {
    syncShareASale();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  const lastSyncText = shareASaleAccount?.last_sync_at 
    ? formatDistanceToNow(new Date(shareASaleAccount.last_sync_at), { addSuffix: true })
    : "Never";

  const metricsData = [
    { 
      label: "Total Earnings", 
      value: metrics ? `$${metrics.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
      change: metrics ? `${metrics.earningsChange >= 0 ? '+' : ''}${metrics.earningsChange}%` : "0%", 
      positive: metrics ? metrics.earningsChange >= 0 : true, 
      icon: DollarSign,
      description: "Last 30 days"
    },
    { 
      label: "Total Clicks", 
      value: metrics ? metrics.totalClicks.toLocaleString() : "0",
      change: metrics ? `${metrics.clicksChange >= 0 ? '+' : ''}${metrics.clicksChange}%` : "0%", 
      positive: metrics ? metrics.clicksChange >= 0 : true, 
      icon: MousePointerClick,
      description: "Last 30 days"
    },
    { 
      label: "Conversions", 
      value: metrics ? metrics.totalConversions.toLocaleString() : "0",
      change: metrics ? `${metrics.conversionsChange >= 0 ? '+' : ''}${metrics.conversionsChange}%` : "0%", 
      positive: metrics ? metrics.conversionsChange >= 0 : true, 
      icon: TrendingUp,
      description: "Last 30 days"
    },
    { 
      label: "Avg Commission", 
      value: metrics ? `$${metrics.avgCommission.toFixed(2)}` : "$0.00",
      change: metrics ? `${metrics.commissionChange >= 0 ? '+' : ''}${metrics.commissionChange}%` : "0%", 
      positive: metrics ? metrics.commissionChange >= 0 : true, 
      icon: BarChart3,
      description: "Per conversion"
    }
  ];

  const maxEarnings = chartData ? Math.max(...chartData.map(d => d.earnings), 1) : 1;

  if (!shareASaleAccount?.is_connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-xl font-display font-semibold text-foreground">Connect ShareASale</h2>
          <p className="text-muted-foreground">You need to connect your ShareASale account to view your dashboard.</p>
          <Button variant="hero" onClick={() => navigate("/onboarding")}>
            Connect Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-display font-semibold text-lg text-foreground">
                Aff<span className="text-muted-foreground">Hub</span>HQ
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="nav-link nav-link-active">Dashboard</Link>
              <Link to="/transactions" className="nav-link">Transactions</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="hero" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Last sync: {lastSyncText}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Moon className="w-4 h-4" />
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground cursor-pointer">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your affiliate performance at a glance.</p>
          </div>
          <Button variant="glass" size="sm">
            <Calendar className="w-4 h-4" />
            Last 30 Days
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="metric-card">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="w-16 h-5" />
                </div>
                <Skeleton className="w-24 h-8 mb-1" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))
          ) : (
            metricsData.map((metric, index) => (
              <div 
                key={metric.label} 
                className="metric-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <metric.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${metric.positive ? 'text-success' : 'text-destructive'}`}>
                    {metric.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {metric.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Chart and Transactions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Earnings Overview</h2>
                <p className="text-sm text-muted-foreground">Last 30 days performance</p>
              </div>
              <Link to="/transactions">
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            </div>
            <div className="h-64 flex items-end gap-1">
              {chartLoading ? (
                Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-full" />
                ))
              ) : chartData && chartData.length > 0 ? (
                chartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-[hsl(217,91%,60%)] rounded-t-lg transition-all duration-500 hover:bg-[hsl(217,91%,50%)] min-h-[4px]"
                      style={{ height: `${Math.max((data.earnings / maxEarnings) * 100, 2)}%` }}
                      title={`${data.date}: $${data.earnings.toFixed(2)}`}
                    />
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  No earnings data yet
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {transactionsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Skeleton className="w-32 h-4 mb-1" />
                      <Skeleton className="w-20 h-3" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="w-16 h-4 mb-1" />
                      <Skeleton className="w-12 h-4" />
                    </div>
                  </div>
                ))
              ) : recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.merchant_name || 'Unknown Merchant'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.transaction_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'Paid' 
                          ? 'bg-success/10 text-success' 
                          : tx.status === 'Voided'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
