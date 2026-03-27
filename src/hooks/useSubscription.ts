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
    if (!session?.access_token) {
      setState({ isSubscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
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
  }, [session?.access_token]);

  useEffect(() => {
    if (!user) {
      setState({ isSubscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
      return;
    }

    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
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
