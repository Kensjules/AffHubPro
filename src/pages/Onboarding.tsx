import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Key, 
  Hash, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useConnectShareASale, useSyncShareASale } from "@/hooks/useShareASale";
import { z } from "zod";

const credentialsSchema = z.object({
  merchantId: z.string().min(3, "Merchant ID must be at least 3 characters"),
  apiToken: z.string().min(10, "API Token must be at least 10 characters"),
  apiSecret: z.string().min(10, "API Secret must be at least 10 characters"),
});

export default function Onboarding() {
  const [merchantId, setMerchantId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState<{ merchantId?: string; apiToken?: string; apiSecret?: string }>({});
  const navigate = useNavigate();
  
  const connectMutation = useConnectShareASale();
  const syncMutation = useSyncShareASale();

  const validateCredentials = async () => {
    setErrors({});
    
    const result = credentialsSchema.safeParse({ merchantId, apiToken, apiSecret });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await connectMutation.mutateAsync({ merchantId, apiToken, apiSecret });
      setValidated(true);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validated) {
      await validateCredentials();
      return;
    }
    
    // Trigger initial sync
    try {
      await syncMutation.mutateAsync();
      toast.success("Setup complete! Your data is syncing...");
      navigate("/dashboard");
    } catch (error) {
      // Still navigate even if sync fails - they can retry later
      navigate("/dashboard");
    }
  };

  const isValidating = connectMutation.isPending;
  const isSubmitting = syncMutation.isPending;

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Left Panel - Instructions */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-md px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            How to get your ShareASale API credentials
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center shrink-0 text-sm font-bold text-accent-foreground">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Log in to ShareASale</p>
                <p className="text-sm text-muted-foreground">Go to your ShareASale affiliate dashboard</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center shrink-0 text-sm font-bold text-accent-foreground">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Navigate to API Settings</p>
                <p className="text-sm text-muted-foreground">Go to Tools → Merchant API</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center shrink-0 text-sm font-bold text-accent-foreground">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Generate API Token</p>
                <p className="text-sm text-muted-foreground">Create a new API token and copy your credentials</p>
              </div>
            </div>
          </div>
          <a 
            href="https://account.shareasale.com/a-apimanager.cfm" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-accent hover:underline"
          >
            Open ShareASale API Manager
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center glow-sm">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">AffiliateHub</span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-sm text-foreground">Account</span>
            </div>
            <div className="flex-1 h-px bg-accent" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <span className="text-xs font-bold text-accent-foreground">2</span>
              </div>
              <span className="text-sm text-foreground font-medium">Connect</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">3</span>
              </div>
              <span className="text-sm text-muted-foreground">Dashboard</span>
            </div>
          </div>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Connect ShareASale</h1>
            <p className="text-muted-foreground">Enter your API credentials to start syncing your data.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Affiliate ID</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="merchantId"
                  type="text"
                  placeholder="Your affiliate ID"
                  value={merchantId}
                  onChange={(e) => { setMerchantId(e.target.value); setValidated(false); }}
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
              {errors.merchantId && <p className="text-sm text-destructive">{errors.merchantId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="Your API token"
                  value={apiToken}
                  onChange={(e) => { setApiToken(e.target.value); setValidated(false); }}
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
              {errors.apiToken && <p className="text-sm text-destructive">{errors.apiToken}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Your API secret"
                  value={apiSecret}
                  onChange={(e) => { setApiSecret(e.target.value); setValidated(false); }}
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
              {errors.apiSecret && <p className="text-sm text-destructive">{errors.apiSecret}</p>}
            </div>

            {/* Validation Status */}
            {validated && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm text-success">Connection verified successfully</span>
              </div>
            )}

            <div className="flex gap-3">
              {!validated && (
                <Button 
                  type="button"
                  variant="glass" 
                  className="flex-1 h-12" 
                  onClick={validateCredentials}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate Connection"
                  )}
                </Button>
              )}
              <Button 
                type="submit" 
                variant="hero" 
                className="flex-1 h-12" 
                disabled={isSubmitting || isValidating || !validated}
              >
                {isSubmitting ? "Setting up..." : "Continue to Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Your credentials are encrypted and stored securely. We never share your data.
          </p>
        </div>
      </div>
    </div>
  );
}
