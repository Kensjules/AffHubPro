import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ pointerEvents: 'none' }}>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[hsl(217,91%,60%)]/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Your Universal Affiliate Dashboard
            </span>
          </div>

          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-tight tracking-tight animate-fade-in-up" 
            style={{ animationDelay: "0.1s" }}
          >
            One Platform.{" "}
            <span className="text-[hsl(217,91%,60%)]">Infinite</span>
            <br />
            <span className="gradient-text">Revenue.</span>
          </h1>

          <p 
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up text-balance" 
            style={{ animationDelay: "0.2s" }}
          >
            One dashboard for all your affiliate partnerships — networks, direct brands, and individual links. See every earning, click, and conversion in one place.
          </p>

          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" 
            style={{ animationDelay: "0.3s" }}
          >
            <Button variant="hero" size="xl" asChild>
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div 
            className="flex flex-wrap items-center justify-center gap-12 pt-8 animate-fade-in-up" 
            style={{ animationDelay: "0.4s" }}
          >
            <span className="text-sm font-medium text-primary">✓ ShareASale/Awin Integration Live</span>
            <span className="text-sm font-medium text-primary">✓ Real-Time Data Sync</span>
            <span className="text-sm font-medium text-primary">✓ Built for Affiliate Marketers</span>
          </div>
        </div>
      </div>
    </section>
  );
}
