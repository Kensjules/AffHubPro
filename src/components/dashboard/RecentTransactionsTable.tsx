import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Transaction } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";

interface RecentTransactionsTableProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export function RecentTransactionsTable({ transactions, isLoading }: RecentTransactionsTableProps) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-success/10 text-success";
      case "voided":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-24 h-8" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                  <Skeleton className="w-32 h-4 mb-1" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
        <Link to="/transactions">
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No transactions yet. Sync your account to see your data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Store
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr 
                  key={tx.id} 
                  className={cn(
                    "border-b border-border/20 hover:bg-card/30 transition-colors",
                    index === transactions.length - 1 && "border-0"
                  )}
                >
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {new Date(tx.transaction_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-foreground">
                      {tx.merchant_name || "Unknown Merchant"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(tx.amount).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      getStatusStyle(tx.status)
                    )}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
