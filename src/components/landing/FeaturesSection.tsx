import { BarChart3, Shield, Zap, Upload, User, Globe } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "See your earnings, clicks, and conversions updated in real-time with beautiful visualizations."
  },
  {
    icon: Shield,
    title: "Automated Link Protection",
    description: "Real-time scanning detects broken or hijacked affiliate links before they cost you commissions. Protect every click, automatically."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with smart caching. Get insights in milliseconds, not minutes."
  },
  {
    icon: Upload,
    title: "Universal Brand Sync",
    description: "Import a spreadsheet and watch your brand list build itself. The platform learns your business partners instantly — no manual entry required."
  },
  {
    icon: User,
    title: "Personalized Dashboard",
    description: "Custom profile, managed brand list, and tailored analytics. Your dashboard adapts to your business, not the other way around."
  },
  {
    icon: Globe,
    title: "Universal Data Import",
    description: "Import data from ShareASale, Impact, direct brand partnerships, or any affiliate source via CSV. One format, every revenue stream."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
            Everything you need to
            <br />
            <span className="gradient-text">track your success</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features for affiliate marketers who need one source of truth — no matter where revenue comes from.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="metric-card group cursor-default animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
