import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClickBankIntegration {
  id: string;
  nickname: string | null;
  publisher_id: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
}

export function useClickBankIntegration() {
  const { user, session } = useAuth();
  const [integration, setIntegration] = useState<ClickBankIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIntegration();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchIntegration = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("id, publisher_id, is_connected, last_sync_at, nickname")
        .eq("user_id", user.id)
        .eq("integration_type", "clickbank")
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as ClickBankIntegration | null);
    } catch (error) {
      console.error("Error fetching ClickBank integration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (clerkApiKey: string, devApiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !session?.access_token) {
      return { success: false, message: "You must be logged in" };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "store-clickbank-credentials",
        {
          body: { clerkApiKey, devApiKey, testOnly: true },
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
        }
      );

      if (error) throw error;
      return { success: data?.success ?? false, message: data?.message || "Connection test completed" };
    } catch (error: any) {
      return { success: false, message: error.message || "Connection test failed" };
    }
  };

  const saveIntegration = async (nickname: string, clerkApiKey: string, devApiKey: string) => {
    if (!user || !session?.access_token) {
      toast.error("You must be logged in to save integrations");
      return false;
    }

    setIsSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "store-clickbank-credentials",
        {
          body: { nickname, clerkApiKey, devApiKey },
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
        }
      );

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.message || "Failed to store credentials");
      }

      await fetchIntegration();
      toast.success("ClickBank integration connected successfully!");
      return true;
    } catch (error: any) {
      console.error("Error saving ClickBank integration:", error);
      toast.error(error.message || "Failed to save integration");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const disconnectIntegration = async () => {
    if (!integration) return false;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_integrations")
        .update({
          is_connected: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      if (error) throw error;

      await fetchIntegration();
      toast.success("ClickBank integration disconnected");
      return true;
    } catch (error: any) {
      console.error("Error disconnecting ClickBank integration:", error);
      toast.error(error.message || "Failed to disconnect integration");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const syncNow = async () => {
    if (!integration?.is_connected) {
      toast.error("Please connect your ClickBank account first");
      return false;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("sync-clickbank", {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;

      await fetchIntegration();
      toast.success("Sync initiated! Data will be updated shortly.");
      return true;
    } catch (error: any) {
      console.error("Error syncing ClickBank data:", error);
      toast.error(error.message || "Failed to sync data");
      return false;
    }
  };

  return {
    integration,
    isLoading,
    isSaving,
    saveIntegration,
    testConnection,
    disconnectIntegration,
    syncNow,
  };
}
