import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  transaction_id: string;
  merchant_name: string | null;
  amount: number;
  commission: number | null;
  clicks: number | null;
  status: string;
  transaction_date: string;
  click_date: string | null;
  created_at: string;
}

export interface TransactionFilters {
  search?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const { user } = useAuth();
  const { search, status, startDate, endDate, page = 1, pageSize = 10 } = filters;

  return useQuery({
    queryKey: ["transactions", user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };

      let query = supabase
        .from("transactions_cache")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (search) {
        // Sanitize search input: limit length, validate characters, and escape ILIKE special characters
        const trimmed = search.trim().substring(0, 50);
        // Allow only alphanumeric, spaces, hyphens, and underscores
        if (!/^[a-zA-Z0-9\s\-_]*$/.test(trimmed)) {
          return { data: [], count: 0 }; // Invalid search query
        }
        const sanitized = trimmed.replace(/[%_\\]/g, '\\$&');
        // Use suffix-only wildcard for better performance
        query = query.or(`merchant_name.ilike.${sanitized}%,transaction_id.ilike.${sanitized}%`);
      }

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (startDate) {
        query = query.gte("transaction_date", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("transaction_date", endDate.toISOString());
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as Transaction[], count: count || 0 };
    },
    enabled: !!user?.id,
  });
}

export function useRecentTransactions(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-transactions", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("transactions_cache")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id,
  });
}
