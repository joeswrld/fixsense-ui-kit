import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const MaintenanceCostWidget = () => {
  const { data: costData, isLoading } = useQuery({
    queryKey: ["maintenance-costs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get maintenance history for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, error } = await supabase
        .from("maintenance_history")
        .select("cost, maintenance_date, appliances!inner(property_id, properties!inner(user_id))")
        .eq("user_id", user.id)
        .gte("maintenance_date", twelveMonthsAgo.toISOString())
        .order("maintenance_date", { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      data?.forEach((record) => {
        if (record.cost) {
          const date = new Date(record.maintenance_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(record.cost);
        }
      });

      // Format for chart
      const chartData = Object.entries(monthlyData)
        .map(([month, cost]) => ({
          month: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          cost: Math.round(cost * 100) / 100,
        }))
        .slice(-6); // Last 6 months

      // Calculate totals
      const totalCost = Object.values(monthlyData).reduce((sum, cost) => sum + cost, 0);
      const lastMonthCost = chartData.length > 0 ? chartData[chartData.length - 1].cost : 0;
      const prevMonthCost = chartData.length > 1 ? chartData[chartData.length - 2].cost : 0;
      const trend = prevMonthCost > 0 ? ((lastMonthCost - prevMonthCost) / prevMonthCost) * 100 : 0;

      return {
        chartData,
        totalCost: Math.round(totalCost * 100) / 100,
        lastMonthCost: Math.round(lastMonthCost * 100) / 100,
        trend: Math.round(trend * 10) / 10,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const { chartData, totalCost, lastMonthCost, trend } = costData || {
    chartData: [],
    totalCost: 0,
    lastMonthCost: 0,
    trend: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Maintenance Costs
        </CardTitle>
        <CardDescription>Monthly spending trends over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Last Month</p>
            <p className="text-2xl font-bold">${lastMonthCost.toFixed(2)}</p>
            {trend !== 0 && (
              <div className="flex items-center gap-1 text-sm">
                {trend > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">+{trend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">{trend}%</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total (12 months)</p>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              Avg: ${(totalCost / 12).toFixed(2)}/mo
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>No maintenance cost data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
