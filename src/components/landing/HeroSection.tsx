import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent/20 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Now with ShareASale API integration
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            All your affiliate
            <br />
            <span className="gradient-text">earnings in one place</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up text-balance" style={{ animationDelay: "0.2s" }}>
            Connect your ShareASale account and see all your affiliate earnings, clicks, 
            and transactions in a clean, actionable dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/demo">View Live Demo</Link>
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            No credit card required · Free 14-day trial · Cancel anytime
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="glass rounded-2xl p-2 glow">
            <div className="bg-card rounded-xl overflow-hidden border border-border/50">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="p-6 space-y-6">
      {/* Mock Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-muted rounded-lg" />
          <div className="w-8 h-8 rounded-full bg-muted" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Earnings" value="$12,847" change="+12.3%" positive />
        <MetricCard label="Clicks" value="48,392" change="+8.1%" positive />
        <MetricCard label="Conversions" value="1,247" change="+15.7%" positive />
        <MetricCard label="Avg Commission" value="$10.30" change="-2.1%" positive={false} />
      </div>

      {/* Chart Placeholder */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-foreground">Earnings Last 30 Days</span>
          <div className="h-6 w-24 bg-muted rounded" />
        </div>
        <div className="h-48 flex items-end gap-2">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((height, i) => (
            <div
              key={i}
              className="flex-1 gradient-bg rounded-t opacity-80"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, positive }: { label: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="metric-card">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className={`text-sm font-medium ${positive ? 'text-success' : 'text-destructive'}`}>
        {change}
      </p>
    </div>
  );
}
