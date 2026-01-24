import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  highlight?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, highlight, className }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "glass rounded-xl p-6 transition-all duration-300 hover:scale-[1.02]",
        highlight && "border-primary/30 shadow-lg shadow-primary/10",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          highlight ? "bg-primary/20" : "bg-card"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            highlight ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.positive 
              ? "bg-success/10 text-success" 
              : "bg-destructive/10 text-destructive"
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <p className={cn(
        "text-3xl font-bold mb-1",
        highlight ? "gradient-text" : "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
