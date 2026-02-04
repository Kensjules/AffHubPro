import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AffiliateLink {
  id: string;
  user_id: string;
  url: string;
  merchant_name: string | null;
  network: "shareasale" | "awin" | "other";
  status: "active" | "broken" | "recovered" | "ignored";
  last_checked_at: string | null;
  http_status_code: number | null;
  recovery_suggestion: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkStats {
  total: number;
  active: number;
  broken: number;
  recovered: number;
  ignored: number;
}

export function useAffiliateLinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["affiliate-links", user?.id],
    queryFn: async (): Promise<AffiliateLink[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching affiliate links:", error);
        throw error;
      }

      return (data || []) as AffiliateLink[];
    },
    enabled: !!user?.id,
  });
}

export function useBrokenLinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["broken-links", user?.id],
    queryFn: async (): Promise<AffiliateLink[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "broken")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching broken links:", error);
        throw error;
      }

      return (data || []) as AffiliateLink[];
    },
    enabled: !!user?.id,
  });
}

export function useLinkStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["link-stats", user?.id],
    queryFn: async (): Promise<LinkStats> => {
      if (!user?.id) {
        return { total: 0, active: 0, broken: 0, recovered: 0, ignored: 0 };
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("status")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching link stats:", error);
        throw error;
      }

      const stats: LinkStats = {
        total: data?.length || 0,
        active: data?.filter((l) => l.status === "active").length || 0,
        broken: data?.filter((l) => l.status === "broken").length || 0,
        recovered: data?.filter((l) => l.status === "recovered").length || 0,
        ignored: data?.filter((l) => l.status === "ignored").length || 0,
      };

      return stats;
    },
    enabled: !!user?.id,
  });
}

export function useAddAffiliateLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (link: {
      url: string;
      merchant_name?: string;
      network: "shareasale" | "awin" | "other";
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          url: link.url,
          merchant_name: link.merchant_name || null,
          network: link.network,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success("Affiliate link added");
    },
    onError: (error) => {
      console.error("Error adding affiliate link:", error);
      toast.error("Failed to add affiliate link");
    },
  });
}

export function useReplaceLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, newUrl }: { linkId: string; newUrl: string }) => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .update({
          url: newUrl,
          status: "recovered",
          http_status_code: null,
          recovery_suggestion: null,
        })
        .eq("id", linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success("Link replaced successfully");
    },
    onError: (error) => {
      console.error("Error replacing link:", error);
      toast.error("Failed to replace link");
    },
  });
}

export function useIgnoreLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .update({ status: "ignored" })
        .eq("id", linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success("Link ignored");
    },
    onError: (error) => {
      console.error("Error ignoring link:", error);
      toast.error("Failed to ignore link");
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("affiliate_links").delete().eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success("Link deleted");
    },
    onError: (error) => {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    },
  });
}

export function useScanLinks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No session");
      }

      const response = await supabase.functions.invoke("scan-affiliate-links", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["broken-links"] });
      queryClient.invalidateQueries({ queryKey: ["link-stats"] });
      toast.success(`Scan complete: ${data?.scanned || 0} links checked`);
    },
    onError: (error) => {
      console.error("Error scanning links:", error);
      toast.error("Failed to scan links");
    },
  });
}
