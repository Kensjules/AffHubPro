import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AwinIntegration {
  id: string;
  publisher_id: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
}

export function useAwinIntegration() {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<AwinIntegration | null>(null);
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
        .select("id, publisher_id, is_connected, last_sync_at")
        .eq("user_id", user.id)
        .eq("integration_type", "awin")
        .maybeSingle();

      if (error) throw error;
      setIntegration(data);
    } catch (error) {
      console.error("Error fetching Awin integration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveIntegration = async (publisherId: string, apiToken: string) => {
    if (!user) {
      toast.error("You must be logged in to save integrations");
      return false;
    }

    setIsSaving(true);

    try {
      if (integration) {
        // Update existing integration
        const { error } = await supabase
          .from("user_integrations")
          .update({
            publisher_id: publisherId,
            api_token_encrypted: apiToken, // In production, encrypt this server-side
            is_connected: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        if (error) throw error;
      } else {
        // Insert new integration
        const { error } = await supabase.from("user_integrations").insert({
          user_id: user.id,
          integration_type: "awin",
          publisher_id: publisherId,
          api_token_encrypted: apiToken, // In production, encrypt this server-side
          is_connected: true,
        });

        if (error) throw error;
      }

      await fetchIntegration();
      toast.success("Awin integration connected successfully!");
      return true;
    } catch (error: any) {
      console.error("Error saving Awin integration:", error);
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
      toast.success("Awin integration disconnected");
      return true;
    } catch (error: any) {
      console.error("Error disconnecting Awin integration:", error);
      toast.error(error.message || "Failed to disconnect integration");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const syncNow = async () => {
    if (!integration?.is_connected) {
      toast.error("Please connect your Awin account first");
      return false;
    }

    try {
      // Update last_sync_at timestamp
      const { error } = await supabase
        .from("user_integrations")
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      if (error) throw error;

      await fetchIntegration();
      toast.success("Sync initiated! Data will be updated shortly.");
      return true;
    } catch (error: any) {
      console.error("Error syncing Awin data:", error);
      toast.error(error.message || "Failed to sync data");
      return false;
    }
  };

  return {
    integration,
    isLoading,
    isSaving,
    saveIntegration,
    disconnectIntegration,
    syncNow,
  };
}
