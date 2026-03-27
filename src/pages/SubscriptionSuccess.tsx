import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    refreshSubscription();
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, refreshSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-6 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome to Pro!
        </h1>
        <p className="text-muted-foreground">
          Your subscription is now active. You have access to all Pro features including unlimited stores, CSV import, and advanced analytics.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard in {countdown}s...
        </p>
      </div>
    </div>
  );
}
