import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Moon, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30" style={{ zIndex: 9999 }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display font-semibold text-lg text-foreground">
            Aff<span className="text-muted-foreground">Hub</span>Pro
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Moon className="w-4 h-4" />
          </Button>
          <Link to="/dashboard" className="nav-link font-medium">Dashboard</Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground cursor-pointer"
            style={{ pointerEvents: 'auto' }}
            onClick={() => {
              window.location.href = "/settings";
            }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {user ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
