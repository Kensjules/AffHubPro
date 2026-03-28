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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2, ExternalLink, HelpCircle, CheckCircle2, XCircle } from "lucide-react";

interface ClickBankConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (nickname: string, clerkApiKey: string, devApiKey: string) => Promise<boolean>;
  onTestConnection: (clerkApiKey: string, devApiKey: string) => Promise<{ success: boolean; message: string }>;
  isSaving: boolean;
  defaultNickname?: string;
}

export function ClickBankConnectDialog({
  open,
  onOpenChange,
  onConnect,
  onTestConnection,
  isSaving,
  defaultNickname = "",
}: ClickBankConnectDialogProps) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [clerkApiKey, setClerkApiKey] = useState("");
  const [devApiKey, setDevApiKey] = useState("");
  const [showClerkKey, setShowClerkKey] = useState(false);
  const [showDevKey, setShowDevKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!nickname.trim()) {
      newErrors.nickname = "Nickname is required";
    } else if (nickname.trim().length > 100) {
      newErrors.nickname = "Nickname must be under 100 characters";
    }

    if (!clerkApiKey.trim()) {
      newErrors.clerkApiKey = "Clerk API Key is required";
    } else if (clerkApiKey.trim().length < 10) {
      newErrors.clerkApiKey = "API Key appears too short";
    }

    if (!devApiKey.trim()) {
      newErrors.devApiKey = "Developer API Key is required";
    } else if (devApiKey.trim().length < 10) {
      newErrors.devApiKey = "API Key appears too short";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!clerkApiKey.trim() || !devApiKey.trim()) {
      setErrors({
        ...errors,
        ...(clerkApiKey.trim() ? {} : { clerkApiKey: "Required for testing" }),
        ...(devApiKey.trim() ? {} : { devApiKey: "Required for testing" }),
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await onTestConnection(clerkApiKey.trim(), devApiKey.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await onConnect(nickname.trim(), clerkApiKey.trim(), devApiKey.trim());
    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setClerkApiKey("");
    setDevApiKey("");
    setTestResult(null);
    setErrors({});
  };

  const handleClose = () => {
    if (!isSaving) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "#2ECC71" }}>CB</span>
            Connect ClickBank
          </DialogTitle>
          <DialogDescription>
            Enter your ClickBank API credentials to sync transactions automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="cb-nickname">Account Nickname</Label>
            <Input
              id="cb-nickname"
              type="text"
              placeholder='e.g., "My Main Account"'
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (errors.nickname) setErrors({ ...errors, nickname: "" });
              }}
              disabled={isSaving}
              maxLength={100}
              className={errors.nickname ? "border-destructive" : ""}
            />
            {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
          </div>

          {/* Clerk API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="cb-clerk-key">Clerk API Key</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px]">
                  <p className="text-xs">
                    Found in ClickBank → Settings → Account Settings → Clerk API Keys. Generate a key with "Orders" read permission.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                id="cb-clerk-key"
                type={showClerkKey ? "text" : "password"}
                placeholder="Enter your Clerk API key"
                value={clerkApiKey}
                onChange={(e) => {
                  setClerkApiKey(e.target.value);
                  if (errors.clerkApiKey) setErrors({ ...errors, clerkApiKey: "" });
                  setTestResult(null);
                }}
                disabled={isSaving}
                className={`pr-10 ${errors.clerkApiKey ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowClerkKey(!showClerkKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showClerkKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.clerkApiKey && <p className="text-xs text-destructive">{errors.clerkApiKey}</p>}
          </div>

          {/* Developer API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="cb-dev-key">Developer API Key</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px]">
                  <p className="text-xs">
                    Found in ClickBank → Settings → Account Settings → Developer API Keys. Create or copy your developer key.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                id="cb-dev-key"
                type={showDevKey ? "text" : "password"}
                placeholder="Enter your Developer API key"
                value={devApiKey}
                onChange={(e) => {
                  setDevApiKey(e.target.value);
                  if (errors.devApiKey) setErrors({ ...errors, devApiKey: "" });
                  setTestResult(null);
                }}
                disabled={isSaving}
                className={`pr-10 ${errors.devApiKey ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowDevKey(!showDevKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showDevKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.devApiKey && <p className="text-xs text-destructive">{errors.devApiKey}</p>}
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving || !clerkApiKey.trim() || !devApiKey.trim()}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>

            {testResult && (
              <Badge
                variant="outline"
                className={
                  testResult.success
                    ? "bg-accent/20 text-accent border-accent/30 w-full justify-center py-1.5"
                    : "bg-destructive/10 text-destructive border-destructive/30 w-full justify-center py-1.5"
                }
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {testResult.message}
              </Badge>
            )}
          </div>

          {/* Help link */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span>
              Need help?{" "}
              <a
                href="https://support.clickbank.com/hc/en-us/articles/220364927-ClickBank-API"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View ClickBank API documentation
              </a>
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
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
