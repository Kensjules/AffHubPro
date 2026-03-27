import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { refreshSubscription, isSubscribed } = useSubscription();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [countdown, setCountdown] = useState(5);
  const confirmedRef = useRef(false);

  const firstName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  // Aggressive polling until subscription is confirmed
  useEffect(() => {
    refreshSubscription();

    const pollInterval = setInterval(() => {
      if (!confirmedRef.current) {
        refreshSubscription();
      }
    }, 2000);

    const pollTimeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(pollTimeout);
    };
  }, [refreshSubscription]);

  // Track when subscription is confirmed
  useEffect(() => {
    if (isSubscribed) {
      confirmedRef.current = true;
    }
  }, [isSubscribed]);

  // Countdown and redirect
  useEffect(() => {
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
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-6 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome to Pro, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          Your subscription is now active. You have access to all Pro features including unlimited stores, CSV import, and advanced analytics.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {!isSubscribed && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>Redirecting to dashboard in {countdown}s...</span>
        </div>
      </div>
    </div>
  );
}
