import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";

const transactions = [
  { id: "TXN-001", merchant: "Amazon Associates", amount: "$127.50", clicks: 342, date: "Jan 15, 2026", status: "Paid" },
  { id: "TXN-002", merchant: "Nike Affiliate", amount: "$89.99", clicks: 156, date: "Jan 14, 2026", status: "Pending" },
  { id: "TXN-003", merchant: "Best Buy Partners", amount: "$234.00", clicks: 498, date: "Jan 13, 2026", status: "Paid" },
  { id: "TXN-004", merchant: "Walmart Affiliates", amount: "$56.25", clicks: 89, date: "Jan 12, 2026", status: "Paid" },
  { id: "TXN-005", merchant: "Target Partners", amount: "$178.90", clicks: 267, date: "Jan 11, 2026", status: "Pending" },
  { id: "TXN-006", merchant: "Home Depot Affiliates", amount: "$312.45", clicks: 412, date: "Jan 10, 2026", status: "Paid" },
  { id: "TXN-007", merchant: "Nordstrom Partners", amount: "$94.30", clicks: 178, date: "Jan 9, 2026", status: "Paid" },
  { id: "TXN-008", merchant: "Sephora Affiliates", amount: "$67.80", clicks: 134, date: "Jan 8, 2026", status: "Voided" },
  { id: "TXN-009", merchant: "REI Partners", amount: "$145.00", clicks: 289, date: "Jan 7, 2026", status: "Paid" },
  { id: "TXN-010", merchant: "Wayfair Affiliates", amount: "$223.15", clicks: 367, date: "Jan 6, 2026", status: "Pending" },
];

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const filteredTransactions = transactions.filter(tx => 
    tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-success/10 text-success";
      case "Pending":
        return "bg-warning/10 text-warning";
      case "Voided":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
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
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/transactions" className="nav-link nav-link-active">Transactions</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="glass" 
              size="sm" 
              onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); }}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
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
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">View and export all your affiliate transactions.</p>
          </div>
          <Button variant="accent" size="sm">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="glass" size="sm">
              <Calendar className="w-4 h-4" />
              Date Range
            </Button>
            <Button variant="glass" size="sm">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Transaction ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Merchant</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clicks</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-foreground">{tx.id}</td>
                    <td className="p-4 text-sm text-foreground font-medium">{tx.merchant}</td>
                    <td className="p-4 text-sm text-foreground font-semibold">{tx.amount}</td>
                    <td className="p-4 text-sm text-muted-foreground">{tx.clicks.toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{tx.date}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing 1-10 of 247 transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="glass" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="glass" size="sm">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
