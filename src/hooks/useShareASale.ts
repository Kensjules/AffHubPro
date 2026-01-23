import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ShareASaleAccount {
  id: string;
  user_id: string;
  merchant_id: string;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export function useShareASaleAccount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["shareasale-account", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("shareasale_accounts")
        .select("id, user_id, merchant_id, is_connected, last_sync_at, sync_status, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ShareASaleAccount | null;
    },
    enabled: !!user?.id,
  });
}

export function useConnectShareASale() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async ({
      merchantId,
      apiToken,
      apiSecret,
    }: {
      merchantId: string;
      apiToken: string;
      apiSecret: string;
    }) => {
      if (!user?.id || !session?.access_token) throw new Error("Not authenticated");

      // Call edge function to validate credentials
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        "validate-shareasale",
        {
          body: { merchantId, apiToken, apiSecret },
        }
      );

      if (validationError) throw validationError;
      if (!validationResult?.valid) {
        throw new Error(validationResult?.message || "Invalid ShareASale credentials");
      }

      // Call edge function to store credentials server-side
      const { data: storeResult, error: storeError } = await supabase.functions.invoke(
        "store-shareasale-credentials",
        {
          body: { merchantId, apiToken, apiSecret },
        }
      );

      if (storeError) throw storeError;
      if (!storeResult?.success) {
        throw new Error(storeResult?.message || "Failed to store credentials");
      }
      return storeResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareasale-account"] });
      toast.success("ShareASale account connected successfully!");
    },
    onError: (error) => {
      toast.error("Failed to connect: " + error.message);
    },
  });
}

export function useDisconnectShareASale() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("shareasale_accounts")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareasale-account"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("ShareASale account disconnected");
    },
    onError: (error) => {
      toast.error("Failed to disconnect: " + error.message);
    },
  });
}

export function useSyncShareASale() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("sync-shareasale", {});

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.message || "Sync failed");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shareasale-account"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success(`Synced ${data?.transactionCount || 0} transactions`);
    },
    onError: (error) => {
      toast.error("Sync failed: " + error.message);
    },
  });
}
