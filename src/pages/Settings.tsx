import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  Link2,
  Shield,
  CheckCircle2,
  RefreshCw,
  Trash2,
  XCircle,
  Plus,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useShareASaleAccount, useConnectShareASale, useDisconnectShareASale, useSyncShareASale } from "@/hooks/useShareASale";
import { useAwinIntegration } from "@/hooks/useAwinIntegration";
import { formatDistanceToNow } from "date-fns";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ShareASaleConnectDialog } from "@/components/integrations/ShareASaleConnectDialog";
import { AwinConnectDialog } from "@/components/integrations/AwinConnectDialog";
import { LiveRevenueFeed } from "@/components/dashboard/LiveRevenueFeed";
import { LinkVault } from "@/components/dashboard/LinkVault";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Tab = "account" | "integrations" | "datahub" | "security";

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile();
  
  // ShareASale hooks
  const { data: shareASaleAccount, isLoading: sasLoading } = useShareASaleAccount();
  const { mutate: connectShareASale, isPending: connectingSAS } = useConnectShareASale();
  const { mutate: disconnectShareASale, isPending: disconnectingSAS } = useDisconnectShareASale();
  const { mutate: syncShareASale, isPending: syncingSAS } = useSyncShareASale();

  // Awin hooks
  const { 
    integration: awinIntegration, 
    isLoading: awinLoading, 
    isSaving: awinSaving,
    saveIntegration: connectAwin,
    disconnectIntegration: disconnectAwin,
    syncNow: syncAwin
  } = useAwinIntegration();

  const [activeTab, setActiveTab] = useState<Tab>("datahub");
  
  // Dialog states
  const [showSASDialog, setShowSASDialog] = useState(false);
  const [showAwinDialog, setShowAwinDialog] = useState(false);
  
  // Account form state
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  // Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setTimezone(profile.timezone || "America/New_York");
    }
  }, [profile]);

  const tabs = [
    { id: "account" as Tab, label: "Account", icon: User },
    { id: "integrations" as Tab, label: "Integrations", icon: Link2 },
    { id: "datahub" as Tab, label: "Data Hub", icon: Activity },
    { id: "security" as Tab, label: "Security", icon: Shield },
  ];

  const handleSaveAccount = () => {
    updateProfile({ display_name: displayName, timezone });
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setUpdatingPassword(false);

    if (error) {
      toast.error("Failed to update password: " + error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleConnectShareASale = async (merchantId: string, apiToken: string, apiSecret: string) => {
    connectShareASale(
      { merchantId, apiToken, apiSecret },
      { onSuccess: () => setShowSASDialog(false) }
    );
  };

  const handleConnectAwin = async (publisherId: string, apiToken: string) => {
    const success = await connectAwin(publisherId, apiToken);
    if (success) {
      setShowAwinDialog(false);
    }
    return success;
  };

  const sasLastSync = shareASaleAccount?.last_sync_at 
    ? formatDistanceToNow(new Date(shareASaleAccount.last_sync_at), { addSuffix: true })
    : "Never";

  const awinLastSync = awinIntegration?.last_sync_at 
    ? formatDistanceToNow(new Date(awinIntegration.last_sync_at), { addSuffix: true })
    : "Never";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-16 lg:ml-64 p-6 lg:p-8 transition-all duration-300">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and integrations.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-5xl">
          {/* Tabs */}
          <div className="w-full md:w-48 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="glass rounded-xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Account Settings</h2>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>

                {profileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="w-full max-w-md h-10" />
                    <Skeleton className="w-full max-w-md h-10" />
                    <Skeleton className="w-full max-w-md h-10" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-card border-border max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted border-border max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full max-w-md h-10 rounded-lg bg-card border border-border px-3 text-sm text-foreground"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                )}

                <Button variant="hero" onClick={handleSaveAccount} disabled={updatingProfile}>
                  {updatingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                {/* ShareASale Card */}
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                          <rect x="2" y="4" width="12" height="12" rx="2" className="fill-primary" />
                          <path d="M8 7C6.3 7 5 8.3 5 10C5 11 5.5 11.9 6.3 12.4V14.5L8.5 13C9.3 12.5 11 11 11 10C11 8.3 9.7 7 8 7Z" fill="white" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">ShareASale</h3>
                        <p className="text-sm text-muted-foreground">Connect your ShareASale affiliate account</p>
                      </div>
                    </div>
                    {sasLoading ? (
                      <Skeleton className="w-20 h-6 rounded-full" />
                    ) : shareASaleAccount?.is_connected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                        <XCircle className="w-3 h-3" />
                        Not Connected
                      </span>
                    )}
                  </div>

                  {sasLoading ? (
                    <Skeleton className="w-full h-20 rounded-lg" />
                  ) : shareASaleAccount?.is_connected ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Merchant ID</p>
                          <p className="text-sm font-medium text-foreground">
                            •••••{shareASaleAccount.merchant_id?.slice(-4) || "••••"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Synced</p>
                          <p className="text-sm font-medium text-foreground">{sasLastSync}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="glass" size="sm" onClick={() => syncShareASale()} disabled={syncingSAS}>
                          <RefreshCw className={`w-4 h-4 ${syncingSAS ? 'animate-spin' : ''}`} />
                          {syncingSAS ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              Disconnect
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disconnect ShareASale?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove your ShareASale connection and delete all cached transaction data. You can reconnect anytime.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => disconnectShareASale()}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {disconnectingSAS ? "Disconnecting..." : "Disconnect"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  ) : (
                    <Button variant="hero" size="sm" onClick={() => setShowSASDialog(true)}>
                      <Plus className="w-4 h-4" />
                      Connect ShareASale
                    </Button>
                  )}
                </div>

                {/* Awin Card */}
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                          <path d="M12 4L6 16H9L10.5 12H13.5L15 16H18L12 4Z" className="fill-accent" />
                          <path d="M10.5 12L12 8L13.5 12H10.5Z" fill="white" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Awin</h3>
                        <p className="text-sm text-muted-foreground">Connect your Awin publisher account</p>
                      </div>
                    </div>
                    {awinLoading ? (
                      <Skeleton className="w-20 h-6 rounded-full" />
                    ) : awinIntegration?.is_connected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                        <XCircle className="w-3 h-3" />
                        Not Connected
                      </span>
                    )}
                  </div>

                  {awinLoading ? (
                    <Skeleton className="w-full h-20 rounded-lg" />
                  ) : awinIntegration?.is_connected ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Publisher ID</p>
                          <p className="text-sm font-medium text-foreground">
                            {awinIntegration.publisher_id || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Synced</p>
                          <p className="text-sm font-medium text-foreground">{awinLastSync}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="glass" size="sm" onClick={syncAwin} disabled={awinSaving}>
                          <RefreshCw className={`w-4 h-4 ${awinSaving ? 'animate-spin' : ''}`} />
                          {awinSaving ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              Disconnect
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disconnect Awin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will disconnect your Awin account. You can reconnect anytime with your Publisher ID and API token.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={disconnectAwin}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {awinSaving ? "Disconnecting..." : "Disconnect"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  ) : (
                    <Button variant="hero" size="sm" onClick={() => setShowAwinDialog(true)}>
                      <Plus className="w-4 h-4" />
                      Connect Awin
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Data Hub Tab */}
            {activeTab === "datahub" && (
              <div className="space-y-6">
                <LiveRevenueFeed />
                
                {/* Link Vault */}
                <LinkVault />
                
                {/* Quick Actions */}
                <div className="glass rounded-xl p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Quick Sync</h2>
                    <p className="text-sm text-muted-foreground">Manually trigger data sync for connected networks</p>
                  </div>
                  <div className="flex gap-3">
                    {shareASaleAccount?.is_connected && (
                      <Button 
                        variant="glass" 
                        size="sm" 
                        onClick={() => syncShareASale()} 
                        disabled={syncingSAS}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingSAS ? 'animate-spin' : ''}`} />
                        {syncingSAS ? 'Syncing...' : 'Sync ShareASale'}
                      </Button>
                    )}
                    {awinIntegration?.is_connected && (
                      <Button 
                        variant="glass" 
                        size="sm" 
                        onClick={syncAwin} 
                        disabled={awinSaving}
                      >
                        <RefreshCw className={`w-4 h-4 ${awinSaving ? 'animate-spin' : ''}`} />
                        {awinSaving ? 'Syncing...' : 'Sync Awin'}
                      </Button>
                    )}
                    {!shareASaleAccount?.is_connected && !awinIntegration?.is_connected && (
                      <p className="text-sm text-muted-foreground">
                        Connect a network in the Integrations tab to enable sync
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="glass rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Change Password</h2>
                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-card border-border max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-card border-border max-w-md"
                      />
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>

                <div className="glass rounded-xl p-6 space-y-4 border border-destructive/20">
                  <div>
                    <h2 className="text-lg font-semibold text-destructive mb-1">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ShareASaleConnectDialog
        open={showSASDialog}
        onOpenChange={setShowSASDialog}
        onConnect={handleConnectShareASale}
        isSaving={connectingSAS}
      />
      <AwinConnectDialog
        open={showAwinDialog}
        onOpenChange={setShowAwinDialog}
        onConnect={handleConnectAwin}
        isSaving={awinSaving}
        defaultPublisherId={awinIntegration?.publisher_id || ""}
      />
    </div>
  );
}
