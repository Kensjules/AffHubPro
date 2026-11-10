import { CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { useEarningsHistory } from "@/hooks/useEarningsHistory";
import { sumBetween } from "@/lib/earnings";

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function WeeklySummary() {
  const { data: rows = [] } = useEarningsHistory();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 864e5);
  const thisWeek = rows.filter((r) => new Date(r.date) >= weekAgo);
  const total = sumBetween(rows, weekAgo, new Date(now.getTime() + 1));
  const prev = sumBetween(rows, twoWeeksAgo, weekAgo);
  const change = prev > 0 ? Math.round(((total - prev) / prev) * 100) : null;
  const top = Object.entries(thisWeek.reduce<Record<string, number>>((acc, r) => {
    const k = r.merchant || "Unknown"; acc[k] = (acc[k] || 0) + (Number(r.commission) || Number(r.amount) || 0); return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Last 7 Days</h3>
      </div>
      <p className="text-2xl font-bold mb-1">{fmt(total)}</p>
      {change !== null ? (
        <p className={`text-sm flex items-center gap-1 mb-3 ${change >= 0 ? "text-primary" : "text-destructive"}`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change >= 0 ? "+" : ""}{change}% vs. the week before
        </p>
      ) : <p className="text-sm text-muted-foreground mb-3">No earnings the week before to compare.</p>}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-muted-foreground">Sales</p><p className="font-semibold">{thisWeek.length}</p></div>
        <div><p className="text-muted-foreground">Top brand</p><p className="font-semibold truncate">{top ? top[0] : "—"}</p></div>
      </div>
    </div>
  );
}
