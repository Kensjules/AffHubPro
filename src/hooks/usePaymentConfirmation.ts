import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentConfirmationStatus = "confirming" | "confirmed" | "pending";

export function usePaymentConfirmation() {
  const [status, setStatus] = useState<PaymentConfirmationStatus>("confirming");

  useEffect(() => {
    let stopped = false;
    let checking = false;
    const check = async () => {
      if (stopped || checking) return;
      checking = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || stopped) return;
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!stopped && !error && data?.subscribed === true) {
          stopped = true;
          clearInterval(interval);
          clearTimeout(timeout);
          setStatus("confirmed");
        }
      } catch {
        // A temporary failure must never be mistaken for a successful payment.
      } finally {
        checking = false;
      }
    };
    const interval = setInterval(check, 3000);
    const timeout = setTimeout(() => {
      stopped = true;
      clearInterval(interval);
      setStatus("pending");
    }, 30000);
    void check();
    return () => {
      stopped = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return status;
}