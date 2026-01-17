import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login - will be replaced with real auth
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Welcome back!");
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Left Panel - Form */}
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
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
                  className="pl-10 h-12 bg-card border-border"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full h-12" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent hover:underline font-medium">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-card border-l border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center max-w-md px-8">
          <div className="glass rounded-2xl p-8 glow mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card">
                <p className="text-2xl font-bold text-foreground">$12.8k</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
              <div className="metric-card">
                <p className="text-2xl font-bold text-success">+15%</p>
                <p className="text-xs text-muted-foreground">Growth</p>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Track your success
          </h2>
          <p className="text-muted-foreground">
            Get real-time insights into your affiliate performance
          </p>
        </div>
      </div>
    </div>
  );
}
