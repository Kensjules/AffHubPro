import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demonstration
const metrics = [
  { 
    label: "Total Earnings", 
    value: "$12,847.32", 
    change: "+12.3%", 
    positive: true, 
    icon: DollarSign,
    description: "This month"
  },
  { 
    label: "Total Clicks", 
    value: "48,392", 
    change: "+8.1%", 
    positive: true, 
    icon: MousePointerClick,
    description: "This month"
  },
  { 
    label: "Conversions", 
    value: "1,247", 
    change: "+15.7%", 
    positive: true, 
    icon: TrendingUp,
    description: "This month"
  },
  { 
    label: "Avg Commission", 
    value: "$10.30", 
    change: "-2.1%", 
    positive: false, 
    icon: BarChart3,
    description: "Per conversion"
  }
];

const recentTransactions = [
  { id: "TXN-001", merchant: "Amazon Associates", amount: "$127.50", date: "Jan 15, 2026", status: "Paid" },
  { id: "TXN-002", merchant: "Nike Affiliate", amount: "$89.99", date: "Jan 14, 2026", status: "Pending" },
  { id: "TXN-003", merchant: "Best Buy Partners", amount: "$234.00", date: "Jan 13, 2026", status: "Paid" },
  { id: "TXN-004", merchant: "Walmart Affiliates", amount: "$56.25", date: "Jan 12, 2026", status: "Paid" },
  { id: "TXN-005", merchant: "Target Partners", amount: "$178.90", date: "Jan 11, 2026", status: "Pending" },
];

const chartData = [
  { day: "1", earnings: 380 },
  { day: "5", earnings: 520 },
  { day: "10", earnings: 450 },
  { day: "15", earnings: 680 },
  { day: "20", earnings: 540 },
  { day: "25", earnings: 720 },
  { day: "30", earnings: 590 },
];

export default function Dashboard() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center glow-sm">
                <BarChart3 className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">AffiliateHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="nav-link nav-link-active">Dashboard</Link>
              <Link to="/transactions" className="nav-link">Transactions</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="glass" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Last sync: 5m ago</span>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-accent-foreground">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
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
          {metrics.map((metric, index) => (
            <div 
              key={metric.label} 
              className="metric-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg/10 flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-accent" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${metric.positive ? 'text-success' : 'text-destructive'}`}>
                  {metric.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
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
              <Button variant="ghost" size="sm">View Details</Button>
            </div>
            <div className="h-64 flex items-end gap-3">
              {chartData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full gradient-bg rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(data.earnings / 720) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm text-accent hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.merchant}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{tx.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'Paid' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
