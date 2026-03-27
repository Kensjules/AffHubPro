import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PRO_PRODUCT_ID = "prod_UDrcZFHFhVw4Lo";

interface SubscriptionState {
  isSubscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    // Always get a fresh session to avoid expired token errors
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    if (!freshSession?.access_token) {
      setState({ isSubscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${freshSession.access_token}` },
      });

      if (error) throw error;

      setState({
        isSubscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setState({ isSubscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
      return;
    }

    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);

    // Realtime listener for instant updates from webhook
    const channel = supabase
      .channel(`profile-sub-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.subscription_status;
          if (newStatus === "pro" && !state.isSubscribed) {
            // Refresh from Stripe to get full details
            checkSubscription();
          } else if (newStatus === "free" && state.isSubscribed) {
            setState({ isSubscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, checkSubscription]);

  const startCheckout = async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      throw err;
    }
  };

  const openPortal = async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
      throw err;
    }
  };

  return {
    ...state,
    isProPlan: state.isSubscribed && state.productId === PRO_PRODUCT_ID,
    refreshSubscription: checkSubscription,
    startCheckout,
    openPortal,
  };
}
