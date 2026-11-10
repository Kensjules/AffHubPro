import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { EarningRow } from "@/lib/earnings";

export interface SaleRow extends EarningRow { id: string; merchant: string | null; source: "network" | "manual" }

export function useEarningsHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["earnings-history", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<SaleRow[]> => {
      const since = new Date(); since.setDate(since.getDate() - 62);
      const [tx, po] = await Promise.all([
        supabase.from("transactions_cache").select("id, amount, commission, transaction_date, merchant_name")
          .eq("user_id", user!.id).gte("transaction_date", since.toISOString()),
        supabase.from("payouts").select("id, amount, payout_date, brand_source")
          .eq("user_id", user!.id).gte("payout_date", since.toISOString()),
      ]);
      if (tx.error) throw tx.error;
      if (po.error) throw po.error;
      return [
        ...(tx.data || []).map((t) => ({ id: t.id, amount: t.amount, commission: t.commission, date: t.transaction_date, merchant: t.merchant_name, source: "network" as const })),
        ...(po.data || []).map((p) => ({ id: p.id, amount: p.amount, date: p.payout_date, merchant: p.brand_source, source: "manual" as const })),
      ];
    },
  });
}
