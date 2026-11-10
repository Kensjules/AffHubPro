import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEarningsHistory } from "@/hooks/useEarningsHistory";

/** Shows a pop-up when a new commission appears (checks every minute). */
export function SaleAlerts() {
  const { data } = useEarningsHistory();
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!data) return;
    if (!seen.current) { seen.current = new Set(data.map((r) => r.id)); return; }
    for (const r of data) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      if (r.source !== "network") continue;
      const v = Number(r.commission) || Number(r.amount) || 0;
      toast.success(`New sale: $${v.toFixed(2)}`, { description: r.merchant ? `From ${r.merchant}` : undefined });
    }
  }, [data]);
  return null;
}
