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

interface AwinConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (publisherId: string, apiToken: string) => Promise<boolean>;
  isSaving: boolean;
  defaultPublisherId?: string;
}

export function AwinConnectDialog({
  open,
  onOpenChange,
  onConnect,
  isSaving,
  defaultPublisherId = "",
}: AwinConnectDialogProps) {
  const [publisherId, setPublisherId] = useState(defaultPublisherId);
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<{ publisherId?: string; apiToken?: string }>({});

  const validateForm = () => {
    const newErrors: { publisherId?: string; apiToken?: string } = {};

    if (!publisherId.trim()) {
      newErrors.publisherId = "Publisher ID is required";
    } else if (!/^\d+$/.test(publisherId.trim())) {
      newErrors.publisherId = "Publisher ID must be numeric";
    }

    if (!apiToken.trim()) {
      newErrors.apiToken = "OAuth2 API Token is required";
    } else if (apiToken.trim().length < 20) {
      newErrors.apiToken = "API Token appears to be too short";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await onConnect(publisherId.trim(), apiToken.trim());
    if (success) {
      setApiToken("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      setApiToken("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AwinLogoSmall />
            Connect Awin / ShareASale
          </DialogTitle>
          <DialogDescription>
            Enter your Awin Publisher credentials to enable automatic data synchronization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publisher-id">Publisher ID</Label>
            <Input
              id="publisher-id"
              type="text"
              placeholder="e.g., 123456"
              value={publisherId}
              onChange={(e) => {
                setPublisherId(e.target.value);
                if (errors.publisherId) setErrors({ ...errors, publisherId: undefined });
              }}
              disabled={isSaving}
              className={errors.publisherId ? "border-destructive" : ""}
            />
            {errors.publisherId && (
              <p className="text-xs text-destructive">{errors.publisherId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Found in your Awin dashboard under Account &gt; Profile
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-token">OAuth2 API Token</Label>
            <div className="relative">
              <Input
                id="api-token"
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
            <p className="text-xs text-muted-foreground">
              Generate a token in Awin &gt; Tools &gt; API Credentials
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span>
              Need help?{" "}
              <a
                href="https://wiki.awin.com/index.php/Publisher_API"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Awin API documentation
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

// Small version of Awin logo for the dialog header
function AwinLogoSmall() {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-auto"
    >
      <path
        d="M23.5 8L12 32H18.5L21.5 24H31.5L34.5 32H41L29.5 8H23.5ZM23.5 18L26.5 10.5L29.5 18H23.5Z"
        fill="#00B9AE"
      />
      <path
        d="M52 8L46 32H52.5L55 20L60 32H65L70 20L72.5 32H79L73 8H67L62.5 22L58 8H52Z"
        fill="#00B9AE"
      />
      <path d="M82 8V32H88V8H82Z" fill="#00B9AE" />
      <path
        d="M93 8V32H99V20L108 32H116L104 18L115 8H107L99 18V8H93Z"
        fill="#00B9AE"
      />
    </svg>
  );
}
