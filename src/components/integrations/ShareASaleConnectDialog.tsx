import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";

interface ShareASaleConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (merchantId: string, apiToken: string, apiSecret: string) => Promise<void>;
  isSaving: boolean;
}

export function ShareASaleConnectDialog({
  open,
  onOpenChange,
  onConnect,
  isSaving,
}: ShareASaleConnectDialogProps) {
  const [merchantId, setMerchantId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<{ merchantId?: string; apiToken?: string; apiSecret?: string }>({});

  const validateForm = () => {
    const newErrors: { merchantId?: string; apiToken?: string; apiSecret?: string } = {};

    if (!merchantId.trim()) {
      newErrors.merchantId = "Merchant ID is required";
    } else if (!/^\d+$/.test(merchantId.trim())) {
      newErrors.merchantId = "Merchant ID must be numeric";
    }

    if (!apiToken.trim()) {
      newErrors.apiToken = "API Token is required";
    } else if (apiToken.trim().length < 10) {
      newErrors.apiToken = "API Token appears to be too short";
    }

    if (!apiSecret.trim()) {
      newErrors.apiSecret = "API Secret is required";
    } else if (apiSecret.trim().length < 10) {
      newErrors.apiSecret = "API Secret appears to be too short";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onConnect(merchantId.trim(), apiToken.trim(), apiSecret.trim());
    // Parent will handle closing on success
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      setMerchantId("");
      setApiToken("");
      setApiSecret("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareASaleLogoSmall />
            Connect ShareASale
          </DialogTitle>
          <DialogDescription>
            Enter your ShareASale API credentials to enable automatic data synchronization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sas-merchant-id">Merchant/Affiliate ID</Label>
            <Input
              id="sas-merchant-id"
              type="text"
              placeholder="e.g., 123456"
              value={merchantId}
              onChange={(e) => {
                setMerchantId(e.target.value);
                if (errors.merchantId) setErrors({ ...errors, merchantId: undefined });
              }}
              disabled={isSaving}
              className={errors.merchantId ? "border-destructive" : ""}
            />
            {errors.merchantId && (
              <p className="text-xs text-destructive">{errors.merchantId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Found in your ShareASale dashboard under My Account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sas-api-token">API Token</Label>
            <div className="relative">
              <Input
                id="sas-api-token"
                type={showToken ? "text" : "password"}
                placeholder="Enter your API token"
                value={apiToken}
                onChange={(e) => {
                  setApiToken(e.target.value);
                  if (errors.apiToken) setErrors({ ...errors, apiToken: undefined });
                }}
                disabled={isSaving}
                className={`pr-10 ${errors.apiToken ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.apiToken && (
              <p className="text-xs text-destructive">{errors.apiToken}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sas-api-secret">API Secret</Label>
            <div className="relative">
              <Input
                id="sas-api-secret"
                type={showSecret ? "text" : "password"}
                placeholder="Enter your API secret"
                value={apiSecret}
                onChange={(e) => {
                  setApiSecret(e.target.value);
                  if (errors.apiSecret) setErrors({ ...errors, apiSecret: undefined });
                }}
                disabled={isSaving}
                className={`pr-10 ${errors.apiSecret ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.apiSecret && (
              <p className="text-xs text-destructive">{errors.apiSecret}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Generate in ShareASale &gt; Tools &gt; Merchant API
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span>
              Need help?{" "}
              <a
                href="https://www.shareasale.com/info/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View ShareASale API documentation
              </a>
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Small version of ShareASale logo for the dialog header
function ShareASaleLogoSmall() {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-auto"
    >
      <rect x="4" y="8" width="24" height="24" rx="4" fill="#2563EB" />
      <path
        d="M16 14C13.8 14 12 15.8 12 18C12 19.5 12.8 20.8 14 21.5V24L17 22C18.2 21.3 20 19.5 20 18C20 15.8 18.2 14 16 14Z"
        fill="white"
      />
      <text x="34" y="26" fill="#2563EB" fontSize="14" fontWeight="bold" fontFamily="system-ui">
        SAS
      </text>
    </svg>
  );
}
