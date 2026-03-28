import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, RefreshCw, CheckCircle2, Settings2, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { AwinConnectDialog } from "@/components/integrations/AwinConnectDialog";
import { ClickBankConnectDialog } from "@/components/integrations/ClickBankConnectDialog";
import { useAwinIntegration } from "@/hooks/useAwinIntegration";
import { useClickBankIntegration } from "@/hooks/useClickBankIntegration";
import { format } from "date-fns";

// Awin logo SVG component with official teal brand color
const AwinLogo = () => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-auto"
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

export default function Integrations() {
  const [isAwinDialogOpen, setIsAwinDialogOpen] = useState(false);
  const [isCBDialogOpen, setIsCBDialogOpen] = useState(false);
  const { integration, isLoading, isSaving, saveIntegration, syncNow } =
    useAwinIntegration();
  const {
    integration: cbIntegration,
    isLoading: cbIsLoading,
    isSaving: cbIsSaving,
    saveIntegration: cbSaveIntegration,
    testConnection: cbTestConnection,
    syncNow: cbSyncNow,
  } = useClickBankIntegration();

  const isConnected = integration?.is_connected ?? false;
  const cbIsConnected = cbIntegration?.is_connected ?? false;

  const handleSyncNow = async () => {
    await syncNow();
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-16 lg:ml-64 p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground mb-2">
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your affiliate networks to sync data automatically
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Awin / ShareASale Card */}
          <div
            className={`glass rounded-xl p-6 space-y-4 transition-all duration-200 ${
              !isConnected ? "cursor-pointer hover:border-primary/50 hover:shadow-lg" : ""
            }`}
            onClick={() => {
              if (!isConnected && !isLoading) {
                setIsAwinDialogOpen(true);
              }
            }}
          >
            {/* Header with Logo and Status */}
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-card/50">
                <AwinLogo />
              </div>
              {isLoading ? (
                <Badge variant="outline" className="text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading
                </Badge>
              ) : isConnected ? (
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not Connected
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Awin / ShareASale
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sync your affiliate transactions, commissions, and merchant data
                automatically.
              </p>
            </div>

            {/* Connected State - Show Publisher ID and Actions */}
            {isConnected && integration && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Publisher ID</span>
                  <span className="font-mono text-foreground">
                    {integration.publisher_id}
                  </span>
                </div>

                {integration.last_sync_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Synced</span>
                    <span className="text-foreground">
                      {format(new Date(integration.last_sync_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncNow();
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Sync Now
                  </Button>
                </div>
              </div>
            )}

            {/* Not Connected State - Show Click Prompt */}
            {!isConnected && !isLoading && (
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm font-medium text-primary">
                  Click to connect
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="text-xs">
                      Connect your Awin Publisher account to automatically sync
                      transactions and commission data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* ClickBank — Coming Soon */}
          <div className="glass rounded-xl p-6 space-y-4 opacity-80">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-card/50">
                <span className="text-lg font-bold" style={{ color: "#2ECC71" }}>ClickBank</span>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">ClickBank</h3>
              <p className="text-sm text-muted-foreground mt-1">Digital marketplace leader for health and fitness. Direct API integration coming soon.</p>
            </div>
            <div className="pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={() => toast.success("We'll notify you when ClickBank is available!")}>
                <Bell className="h-4 w-4 mr-1" /> Notify Me
              </Button>
            </div>
          </div>

          {/* Impact — Coming Soon */}
          <div className="glass rounded-xl p-6 space-y-4 opacity-80">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-card/50">
                <span className="text-lg font-bold" style={{ color: "#6366F1" }}>Impact</span>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Impact</h3>
              <p className="text-sm text-muted-foreground mt-1">Connect with brands like Nike, Adidas, and more</p>
            </div>
            <div className="pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={() => toast.success("We'll notify you when Impact is available!")}>
                <Bell className="h-4 w-4 mr-1" /> Notify Me
              </Button>
            </div>
          </div>

          {/* Amazon Associates — Coming Soon */}
          <div className="glass rounded-xl p-6 space-y-4 opacity-80">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-card/50">
                <span className="text-lg font-bold" style={{ color: "#FF9900" }}>Amazon</span>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                Coming Soon
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Amazon Associates</h3>
              <p className="text-sm text-muted-foreground mt-1">Track your Amazon referral commissions</p>
            </div>
            <div className="pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={() => toast.success("We'll notify you when Amazon Associates is available!")}>
                <Bell className="h-4 w-4 mr-1" /> Notify Me
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Connection Dialog */}
      <AwinConnectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConnect={saveIntegration}
        isSaving={isSaving}
        defaultPublisherId={integration?.publisher_id ?? ""}
      />
    </div>
  );
}
