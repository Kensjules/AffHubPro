import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LiveRevenueData {
  potentialCommission: number;  // pending + locked
  actualCommission: number;     // paid
  lastUpdated: Date;
  transactionCount: number;
}

export function useLiveRevenue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["live-revenue", user?.id],
    queryFn: async (): Promise<LiveRevenueData> => {
      if (!user?.id) {
        return {
          potentialCommission: 0,
          actualCommission: 0,
          lastUpdated: new Date(),
          transactionCount: 0,
        };
      }

      const { data: transactions, error } = await supabase
        .from("transactions_cache")
        .select("amount, commission, status")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching live revenue:", error);
        throw error;
      }

      // Calculate potential commission (pending + locked)
      const potentialCommission = (transactions || [])
        .filter((t) => t.status === "pending" || t.status === "locked")
        .reduce((sum, t) => sum + (Number(t.commission) || Number(t.amount) || 0), 0);

      // Calculate actual commission (paid)
      const actualCommission = (transactions || [])
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + (Number(t.commission) || Number(t.amount) || 0), 0);

      return {
        potentialCommission,
        actualCommission,
        lastUpdated: new Date(),
        transactionCount: transactions?.length || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchIntervalInBackground: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
