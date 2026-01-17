import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Settings as SettingsIcon,
  User,
  Link2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Tab = "account" | "connection" | "security";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [syncing, setSyncing] = useState(false);
  
  // Account form state
  const [displayName, setDisplayName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [timezone, setTimezone] = useState("America/New_York");

  const tabs = [
    { id: "account" as Tab, label: "Account", icon: User },
    { id: "connection" as Tab, label: "ShareASale", icon: Link2 },
    { id: "security" as Tab, label: "Security", icon: Shield },
  ];

  const handleSaveAccount = () => {
    toast.success("Account settings saved");
  };

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
              <span className="font-bold text-lg text-foreground">AffiliateHub</span>
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
              onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); }}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-accent-foreground">
              JD
            </div>
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-card border-border max-w-md"
                      />
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

                  <Button variant="accent" onClick={handleSaveAccount}>
                    Save Changes
                  </Button>
                </div>
              )}

              {activeTab === "connection" && (
                <div className="glass rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">ShareASale Connection</h2>
                    <p className="text-sm text-muted-foreground">Manage your ShareASale API connection</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Connected</p>
                      <p className="text-sm text-muted-foreground">Last synced 5 minutes ago</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Merchant ID</Label>
                      <Input
                        value="•••••••1234"
                        disabled
                        className="bg-muted border-border max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>API Token</Label>
                      <Input
                        value="•••••••••••••••••••••••••"
                        disabled
                        className="bg-muted border-border max-w-md"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="glass">
                      <RefreshCw className="w-4 h-4" />
                      Test Connection
                    </Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      Disconnect
                    </Button>
                  </div>
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
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="••••••••"
                          className="bg-card border-border max-w-md"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="••••••••"
                          className="bg-card border-border max-w-md"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="bg-card border-border max-w-md"
                        />
                      </div>
                    </div>

                    <Button variant="accent">Update Password</Button>
                  </div>

                  <div className="glass rounded-xl p-6 space-y-4 border border-destructive/20">
                    <div>
                      <h2 className="text-lg font-semibold text-destructive mb-1">Danger Zone</h2>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
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
