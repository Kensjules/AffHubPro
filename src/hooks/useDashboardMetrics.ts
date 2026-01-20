import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, startOfDay, format } from "date-fns";

export interface DashboardMetrics {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  avgCommission: number;
  earningsChange: number;
  clicksChange: number;
  conversionsChange: number;
  commissionChange: number;
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
          totalEarnings: 0,
          totalClicks: 0,
          totalConversions: 0,
          avgCommission: 0,
          earningsChange: 0,
          clicksChange: 0,
          conversionsChange: 0,
          commissionChange: 0,
        };
      }

      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);

      // Get current period data
      const { data: currentData, error: currentError } = await supabase
        .from("transactions_cache")
        .select("amount, commission, clicks, status")
        .eq("user_id", user.id)
        .gte("transaction_date", thirtyDaysAgo.toISOString());

      if (currentError) throw currentError;

      // Get previous period data for comparison
      const { data: previousData, error: previousError } = await supabase
        .from("transactions_cache")
        .select("amount, commission, clicks, status")
        .eq("user_id", user.id)
        .gte("transaction_date", sixtyDaysAgo.toISOString())
        .lt("transaction_date", thirtyDaysAgo.toISOString());

      if (previousError) throw previousError;

      const current = calculateMetrics(currentData || []);
      const previous = calculateMetrics(previousData || []);

      return {
        ...current,
        earningsChange: calculateChange(current.totalEarnings, previous.totalEarnings),
        clicksChange: calculateChange(current.totalClicks, previous.totalClicks),
        conversionsChange: calculateChange(current.totalConversions, previous.totalConversions),
        commissionChange: calculateChange(current.avgCommission, previous.avgCommission),
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

function calculateMetrics(data: Array<{ amount: number; commission: number | null; clicks: number; status: string }>) {
  const totalEarnings = data.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalClicks = data.reduce((sum, tx) => sum + (tx.clicks || 0), 0);
  const totalConversions = data.filter((tx) => tx.status === "Paid").length;
  const commissions = data.filter((tx) => tx.commission != null).map((tx) => Number(tx.commission));
  const avgCommission = commissions.length > 0 ? commissions.reduce((a, b) => a + b, 0) / commissions.length : 0;

  return { totalEarnings, totalClicks, totalConversions, avgCommission };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
