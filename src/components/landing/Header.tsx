import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Moon, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30" style={{ zIndex: 9999 }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display font-semibold text-lg text-foreground">
            Aff<span className="text-muted-foreground">Hub</span>Pro
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">Workflow</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#blueprint" className="nav-link">Blueprint</a>
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
              console.log("Redirecting to settings...");
              window.location.href = "/settings";
            }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/login" className="flex items-center gap-2">
              <span>Sign Out</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
