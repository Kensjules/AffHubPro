import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  RefreshCw,
  LogOut,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions, TransactionFilters } from "@/hooks/useTransactions";
import { useSyncShareASale, useShareASaleAccount } from "@/hooks/useShareASale";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 10;

export default function Transactions() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: shareASaleAccount } = useShareASaleAccount();
  const { mutate: syncShareASale, isPending: syncing } = useSyncShareASale();

  // Debounce search
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters: TransactionFilters = {
    search: debouncedSearch,
    status: statusFilter,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data: transactionsData, isLoading } = useTransactions(filters);

  const transactions = transactionsData?.data || [];
  const totalCount = transactionsData?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleExportCSV = () => {
    if (!transactions.length) return;

    const headers = ["Transaction ID", "Merchant", "Amount", "Commission", "Clicks", "Date", "Status"];
    const rows = transactions.map(tx => [
      tx.transaction_id,
      tx.merchant_name || "Unknown",
      tx.amount,
      tx.commission || 0,
      tx.clicks,
      format(new Date(tx.transaction_date), "yyyy-MM-dd"),
      tx.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

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

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  if (!shareASaleAccount?.is_connected) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="glass rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-warning mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Connect ShareASale</h2>
          <p className="text-muted-foreground">You need to connect your ShareASale account to view transactions.</p>
          <Button variant="accent" onClick={() => navigate("/onboarding")}>
            Connect Now
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={() => syncShareASale()}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-accent-foreground cursor-pointer">
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
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">View and export all your affiliate transactions.</p>
          </div>
          <Button variant="accent" size="sm" onClick={handleExportCSV} disabled={!transactions.length}>
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
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-card border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Voided">Voided</SelectItem>
              </SelectContent>
            </Select>
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
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-4"><Skeleton className="w-24 h-4" /></td>
                      <td className="p-4"><Skeleton className="w-32 h-4" /></td>
                      <td className="p-4"><Skeleton className="w-16 h-4" /></td>
                      <td className="p-4"><Skeleton className="w-12 h-4" /></td>
                      <td className="p-4"><Skeleton className="w-24 h-4" /></td>
                      <td className="p-4"><Skeleton className="w-16 h-5 rounded-full" /></td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm font-mono text-foreground">{tx.transaction_id}</td>
                      <td className="p-4 text-sm text-foreground font-medium">{tx.merchant_name || 'Unknown'}</td>
                      <td className="p-4 text-sm text-foreground font-semibold">
                        ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{tx.clicks.toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(tx.transaction_date), "MMM d, yyyy")}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {totalCount > 0 
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} transactions`
                : 'No transactions'
              }
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="glass" 
                size="sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button 
                variant="glass" 
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
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
