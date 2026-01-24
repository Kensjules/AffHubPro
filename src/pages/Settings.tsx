import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  User,
  Link2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  LogOut,
  Settings as SettingsIcon,
  XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useShareASaleAccount, useDisconnectShareASale, useSyncShareASale } from "@/hooks/useShareASale";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type Tab = "account" | "connection" | "security";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, updatePassword } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile();
  const { data: shareASaleAccount, isLoading: accountLoading } = useShareASaleAccount();
  const { mutate: disconnectShareASale, isPending: disconnecting } = useDisconnectShareASale();
  const { mutate: syncShareASale, isPending: syncing } = useSyncShareASale();

  const [activeTab, setActiveTab] = useState<Tab>("account");
  
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
    { id: "connection" as Tab, label: "ShareASale", icon: Link2 },
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDisconnect = () => {
    disconnectShareASale();
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  const lastSyncText = shareASaleAccount?.last_sync_at 
    ? formatDistanceToNow(new Date(shareASaleAccount.last_sync_at), { addSuffix: true })
    : "Never";

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center glow-sm">
                <BarChart3 className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">AffHubPro</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/transactions" className="nav-link">Transactions</Link>
              <Link to="/settings" className="nav-link nav-link-active">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="glass" 
              size="sm"
              onClick={() => syncShareASale()}
              disabled={syncing || !shareASaleAccount?.is_connected}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-accent-foreground cursor-pointer">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="w-full">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and connections.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Tabs */}
            <div className="w-full md:w-48 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
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

                  <Button variant="accent" onClick={handleSaveAccount} disabled={updatingProfile}>
                    {updatingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              {activeTab === "connection" && (
                <div className="glass rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">ShareASale Connection</h2>
                    <p className="text-sm text-muted-foreground">Manage your ShareASale API connection</p>
                  </div>

                  {accountLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="w-full h-16 rounded-lg" />
                      <Skeleton className="w-full max-w-md h-10" />
                      <Skeleton className="w-full max-w-md h-10" />
                    </div>
                  ) : shareASaleAccount?.is_connected ? (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium text-foreground">Connected</p>
                          <p className="text-sm text-muted-foreground">Last synced {lastSyncText}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Merchant ID</Label>
                          <Input
                            value={shareASaleAccount.merchant_id ? `•••••••${shareASaleAccount.merchant_id.slice(-4)}` : "••••••••"}
                            disabled
                            className="bg-muted border-border max-w-md"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Sync Status</Label>
                          <Input
                            value={shareASaleAccount.sync_status || "Unknown"}
                            disabled
                            className="bg-muted border-border max-w-md capitalize"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="glass" onClick={() => syncShareASale()} disabled={syncing}>
                          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                          {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-destructive hover:text-destructive">
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
                                onClick={handleDisconnect}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {disconnecting ? "Disconnecting..." : "Disconnect"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                        <XCircle className="w-5 h-5 text-warning" />
                        <div>
                          <p className="font-medium text-foreground">Not Connected</p>
                          <p className="text-sm text-muted-foreground">Connect your ShareASale account to start tracking</p>
                        </div>
                      </div>
                      <Button variant="accent" onClick={() => navigate("/onboarding")}>
                        Connect ShareASale
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                      variant="accent" 
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
                          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => toast.error("Account deletion requires contacting support")}
                          >
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
        </div>
      </main>
    </div>
  );
}
