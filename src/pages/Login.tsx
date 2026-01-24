import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || "Invalid email or password");
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-card border-r border-border relative overflow-hidden">
        {/* Abstract 3D Shapes */}
        <div className="absolute inset-0">
          {/* Large gold gradient orb */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
          {/* Blue accent orb */}
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent rounded-full blur-3xl" />
          {/* Small gold accent */}
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-2xl" />
          
          {/* Geometric 3D shapes */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-primary/30 rounded-2xl rotate-45 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-24 h-24 border border-accent/40 rounded-xl rotate-12 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg rotate-[-15deg] animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md px-8 text-center">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-12">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center glow-sm">
              <BarChart3 className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">AffHubPro</span>
          </Link>

          {/* Testimonial */}
          <div className="glass rounded-2xl p-8 glow">
            <blockquote className="text-xl font-medium text-foreground leading-relaxed mb-6">
              "AffHubPro changed how I track my entire business."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">JD</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Jason Drake</p>
                <p className="text-sm text-muted-foreground">Affiliate Marketer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center glow-sm">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">AffHubPro</span>
          </Link>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back to <span className="gradient-text">AffHubPro</span>
            </h1>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 glass border-border/50 focus:border-primary bg-card/50"
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 glass border-border/50 focus:border-primary bg-card/50"
                  required
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
