import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Loader2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useState } from "react";

const PRO_PRODUCT_ID = "prod_UDrcZFHFhVw4Lo";

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    features: [
      { text: "Track 1 Store" },
      { text: "Manual Data Entry" },
      { text: "30-Day History" },
      { text: "Basic Support" },
    ] as PlanFeature[],
    buttonText: "Get Started",
    buttonVariant: "hero" as const,
    featured: false,
    action: "signup" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    badge: "Most Popular",
    features: [
      { text: "Track Unlimited Stores" },
      { text: "Unlimited CSV Imports", highlight: true },
      { text: "Advanced Profit Analytics", highlight: true },
      { text: "Lifetime History" },
      { text: "Priority Support" },
    ] as PlanFeature[],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    featured: true,
    action: "checkout" as const,
  },
];

export function PricingSection() {
  const { user } = useAuth();
  const { isSubscribed, productId, startCheckout } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckingOut(true);
    try {
      await startCheckout();
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const isActivePlan = (plan: typeof pricingPlans[number]) => {
    if (plan.action === "checkout" && isSubscribed && productId === PRO_PRODUCT_ID) return true;
    if (plan.action === "signup" && user && !isSubscribed) return true;
    return false;
  };

  const getButtonContent = (plan: typeof pricingPlans[number]) => {
    if (isActivePlan(plan)) return "Your Plan";
    if (plan.action === "checkout" && checkingOut) {
      return <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>;
    }
    return plan.buttonText;
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-[hsl(217,91%,60%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that fits your affiliate business. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const active = isActivePlan(plan);
            return (
              <Card
                key={plan.name}
                className={`relative glass border transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${
                  plan.featured
                    ? "border-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                    : "border-border/50 hover:border-border"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      {active ? "✓ Active" : plan.badge}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-display font-bold ${plan.featured ? "gradient-text" : "text-foreground"}`}>
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.featured ? "bg-primary/20" : "bg-muted"
                        }`}>
                          {feature.highlight ? (
                            <Star className="w-3 h-3 text-primary fill-primary" />
                          ) : (
                            <Check className={`w-3 h-3 ${plan.featured ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                        </div>
                        <span className={`text-sm ${feature.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.action === "checkout" ? (
                    user ? (
                      <Button
                        variant={plan.buttonVariant}
                        className={`w-full ${
                          active
                            ? "bg-success/20 text-success border-success/30 hover:bg-success/30"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                        }`}
                        disabled={active || checkingOut}
                        onClick={handleCheckout}
                      >
                        {getButtonContent(plan)}
                      </Button>
                    ) : (
                      <Button
                        variant={plan.buttonVariant}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                        asChild
                      >
                        <Link to="/signup">Start Free Trial</Link>
                      </Button>
                    )
                  ) : (
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full ${active ? "bg-success/20 text-success border-success/30 hover:bg-success/30" : ""}`}
                      disabled={active}
                      asChild={!active}
                    >
                      {active ? <span>Your Plan</span> : <Link to="/signup">{plan.buttonText}</Link>}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-12">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
