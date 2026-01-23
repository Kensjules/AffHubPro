import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-display font-semibold text-lg text-foreground">
              Aff<span className="text-muted-foreground">Hub</span>HQ
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="nav-link">Privacy</Link>
            <Link to="/terms" className="nav-link">Terms</Link>
            <a href="mailto:support@affhubhq.io" className="nav-link">Support</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AffHubHQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
