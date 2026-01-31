import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Receipt, 
  Store, 
  FileBarChart, 
  Plug,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transactions", icon: Receipt, path: "/transactions" },
  { label: "Stores", icon: Store, path: "/stores", disabled: true },
  { label: "Reports", icon: FileBarChart, path: "/reports", disabled: true },
  { label: "Integrations", icon: Plug, path: "/integrations" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear local storage first
      localStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Logout error:", error);
        toast.error("Failed to sign out");
        setLoggingOut(false);
        return;
      }
      
      // Force redirect to the AffHubPro landing page (root of the app)
      // Using navigate ensures we stay within the app
      navigate("/", { replace: true });
      
      // Force a page reload to clear all state
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to sign out");
      setLoggingOut(false);
    }
  };

  // Get display name or email
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen glass border-r border-border/30 flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border/30">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-lg text-foreground">
              Aff<span className="text-muted-foreground">Hub</span>Pro
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.disabled ? "#" : item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Soon
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-border/30 space-y-3">
        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-2 py-2",
          collapsed && "justify-center"
        )}>
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
        >
          <LogOut className={cn("w-5 h-5", loggingOut && "animate-spin")} />
          {!collapsed && <span className="ml-3">{loggingOut ? "Signing out..." : "Sign Out"}</span>}
        </Button>
      </div>
    </aside>
  );
}
