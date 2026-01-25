import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, startOfDay, format } from "date-fns";

export interface DashboardMetrics {
  totalRevenue: number;
  pendingPayouts: number;
  activeStores: number;
  revenueChange: number;
  pendingChange: number;
  storesChange: number;
}

export interface ChartDataPoint {
  date: string;
  earnings: number;
}

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-metrics", user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!user?.id) {
        return {
          totalRevenue: 0,
          pendingPayouts: 0,
          activeStores: 0,
          revenueChange: 0,
          pendingChange: 0,
          storesChange: 0,
        };
      }

      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);

      // Get current period data (last 30 days)
      const { data: currentData, error: currentError } = await supabase
        .from("transactions_cache")
        .select("commission, status, merchant_name")
        .eq("user_id", user.id)
        .gte("transaction_date", thirtyDaysAgo.toISOString());

      if (currentError) throw currentError;

      // Get previous period data for comparison (30-60 days ago)
      const { data: previousData, error: previousError } = await supabase
        .from("transactions_cache")
        .select("commission, status, merchant_name")
        .eq("user_id", user.id)
        .gte("transaction_date", sixtyDaysAgo.toISOString())
        .lt("transaction_date", thirtyDaysAgo.toISOString());

      if (previousError) throw previousError;

      // Get all-time data for total revenue and active stores
      const { data: allTimeData, error: allTimeError } = await supabase
        .from("transactions_cache")
        .select("commission, status, merchant_name")
        .eq("user_id", user.id);

      if (allTimeError) throw allTimeError;

      const current = calculateMetrics(currentData || []);
      const previous = calculateMetrics(previousData || []);
      const allTime = calculateMetrics(allTimeData || []);

      return {
        totalRevenue: allTime.totalRevenue,
        pendingPayouts: allTime.pendingPayouts,
        activeStores: allTime.activeStores,
        revenueChange: calculateChange(current.totalRevenue, previous.totalRevenue),
        pendingChange: calculateChange(current.pendingPayouts, previous.pendingPayouts),
        storesChange: calculateChange(current.activeStores, previous.activeStores),
      };
    },
    enabled: !!user?.id,
  });
}

export function useEarningsChart() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["earnings-chart", user?.id],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!user?.id) return [];

      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

      const { data, error } = await supabase
        .from("transactions_cache")
        .select("amount, transaction_date")
        .eq("user_id", user.id)
        .gte("transaction_date", thirtyDaysAgo.toISOString())
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedByDate: Record<string, number> = {};
      
      // Initialize all dates in range
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), 29 - i), "MMM d");
        groupedByDate[date] = 0;
      }

      // Sum amounts per date
      (data || []).forEach((tx) => {
        const date = format(new Date(tx.transaction_date), "MMM d");
        groupedByDate[date] = (groupedByDate[date] || 0) + Number(tx.amount);
      });

      return Object.entries(groupedByDate).map(([date, earnings]) => ({
        date,
        earnings,
      }));
    },
    enabled: !!user?.id,
  });
}

function calculateMetrics(data: Array<{ commission: number | null; status: string; merchant_name: string | null }>) {
  // Total revenue = sum of all commissions (paid/locked transactions)
  const totalRevenue = data
    .filter((tx) => tx.status?.toLowerCase() === "paid" || tx.status?.toLowerCase() === "locked")
    .reduce((sum, tx) => sum + Number(tx.commission || 0), 0);

  // Pending payouts = sum of commissions where status is pending
  const pendingPayouts = data
    .filter((tx) => tx.status?.toLowerCase() === "pending")
    .reduce((sum, tx) => sum + Number(tx.commission || 0), 0);

  // Active stores = count of distinct merchant names
  const uniqueMerchants = new Set(
    data
      .filter((tx) => tx.merchant_name)
      .map((tx) => tx.merchant_name)
  );
  const activeStores = uniqueMerchants.size;

  return { totalRevenue, pendingPayouts, activeStores };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
