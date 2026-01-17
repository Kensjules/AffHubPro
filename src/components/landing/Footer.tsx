import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">AffiliateHub</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="nav-link">Privacy</Link>
            <Link to="/terms" className="nav-link">Terms</Link>
            <a href="mailto:support@affiliatehub.io" className="nav-link">Support</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AffiliateHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
