import { UserPlus, Link2, LayoutDashboard } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description: "Sign up in seconds with just your email. No credit card required to start."
  },
  {
    icon: Link2,
    step: "02",
    title: "Connect ShareASale",
    description: "Enter your ShareASale API credentials. We'll validate them instantly and start syncing."
  },
  {
    icon: LayoutDashboard,
    step: "03",
    title: "View Your Dashboard",
    description: "See all your earnings, transactions, and analytics in one beautiful dashboard."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get started in
            <br />
            <span className="gradient-text">three simple steps</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From signup to insights in under 5 minutes. No complicated setup required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-accent/50 to-transparent" />
              )}

              <div className="relative inline-flex">
                <div className="w-24 h-24 rounded-2xl glass flex items-center justify-center mb-6 mx-auto glow-sm">
                  <step.icon className="w-10 h-10 text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-accent-foreground">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
