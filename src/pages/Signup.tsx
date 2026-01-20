import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const benefits = [
  "Real-time earnings tracking",
  "Automatic data synchronization",
  "Export transactions to CSV",
  "Bank-level security"
];

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ name, email, password });
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    
    if (error) {
      toast.error(error.message || "Failed to create account");
    } else {
      toast.success("Account created! Let's connect your ShareASale account.");
      navigate("/onboarding");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-md px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Start tracking your
            <br />
            <span className="gradient-text">affiliate success</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of affiliate marketers who use AffiliateHub to monitor their earnings.
          </p>
          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent-foreground" />
                </div>
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center glow-sm">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">AffiliateHub</span>
          </Link>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  minLength={8}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full h-12" 
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <p className="text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
