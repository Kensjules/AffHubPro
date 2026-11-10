import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Clock3 } from "lucide-react";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const status = usePaymentConfirmation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-6 animate-fade-in-up" role="status" aria-live="polite">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${status === "confirmed" ? "bg-success/20" : "bg-primary/10"}`}>
          {status === "confirmed" ? <CheckCircle2 className="w-8 h-8 text-success" /> : status === "confirming" ? <Loader2 className="w-8 h-8 text-primary animate-spin motion-reduce:animate-none" /> : <Clock3 className="w-8 h-8 text-primary" />}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {status === "confirmed" ? "You're on Pro" : status === "confirming" ? "Confirming your payment…" : "Payment confirmation pending"}
        </h1>
        <p className="text-muted-foreground">
          {status === "confirmed" ? "Your subscription is now active. You have access to all Pro features including unlimited stores, CSV import, and advanced analytics." : status === "pending" ? "We're still confirming your payment. This can take a minute. Refresh this page or check Settings. If you were charged and it doesn't update, email support." : null}
        </p>
        {status === "confirmed" && <Button variant="hero" onClick={() => navigate("/dashboard", { replace: true })}>Go to Dashboard</Button>}
        {status === "pending" && <div className="flex flex-wrap justify-center gap-3"><Button variant="glass" onClick={() => window.location.reload()}>Refresh</Button><Button variant="hero" onClick={() => navigate("/settings")}>Settings</Button></div>}
      </div>
    </div>
  );
}
