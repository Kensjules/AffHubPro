import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 glow">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
            Ready to take control of your
            <br />
            <span className="gradient-text">affiliate earnings?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of affiliate marketers who've simplified their analytics with AffHubPro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14-day free trial · No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
