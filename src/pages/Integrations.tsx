import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Awin logo SVG component with official teal brand color
const AwinLogo = () => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-auto"
  >
    <path
      d="M23.5 8L12 32H18.5L21.5 24H31.5L34.5 32H41L29.5 8H23.5ZM23.5 18L26.5 10.5L29.5 18H23.5Z"
      fill="#00B9AE"
    />
    <path
      d="M52 8L46 32H52.5L55 20L60 32H65L70 20L72.5 32H79L73 8H67L62.5 22L58 8H52Z"
      fill="#00B9AE"
    />
    <path
      d="M82 8V32H88V8H82Z"
      fill="#00B9AE"
    />
    <path
      d="M93 8V32H99V20L108 32H116L104 18L115 8H107L99 18V8H93Z"
      fill="#00B9AE"
    />
  </svg>
);

export default function Integrations() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      {/* Main Content */}
      <main className="ml-16 lg:ml-64 p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground mb-2">
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your affiliate networks to sync data automatically
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Awin / ShareASale Card */}
          <div className="glass rounded-xl p-6 space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-card/50">
                <AwinLogo />
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Awin / ShareASale
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sync your affiliate transactions, commissions, and merchant data automatically.
              </p>
            </div>

            {/* Toggle with Tooltip */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-sm font-medium text-muted-foreground">
                Sync Account
              </span>
              <div className="flex items-center gap-2">
                <Switch disabled checked={false} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">
                      <span className="font-semibold text-primary">Coming Soon</span>
                      <br />
                      We're building automated API sync for Awin & ShareASale.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
