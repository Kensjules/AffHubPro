import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { ChartDataPoint } from "@/hooks/useDashboardMetrics";

interface RevenueChartProps {
  data: ChartDataPoint[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  earnings: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4 mb-6" />
        <Skeleton className="w-full h-80" />
      </div>
    );
  }

  const hasData = data && data.length > 0 && data.some(d => d.earnings > 0);

  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Revenue over last 30 days</h2>
        <p className="text-sm text-muted-foreground">Track your earnings performance</p>
      </div>

      {!hasData ? (
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          <p>No revenue data available yet. Sync your account to see your earnings.</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
              tickMargin={10}
              width={60}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
