import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, Activity, Loader2, Radio } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";

const AdminAnalytics = () => {
  const realtimeStats = useRealtimeStats();
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const thirtyDaysAgo = subDays(now, 30);

      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // New users this month
      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      // New users today
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", format(now, "yyyy-MM-dd"));

      // Paid users
      const { data: paidUsers } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .in("subscription_tier", ["pro", "business"])
        .eq("subscription_status", "active");

      // Free users
      const { count: freeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("subscription_tier", "free");

      // Conversion rate
      const conversionRate = totalUsers 
        ? ((paidUsers?.length || 0) / totalUsers * 100).toFixed(2)
        : "0";

      // Country breakdown
      const { data: countryData } = await supabase
        .from("profiles")
        .select("country")
        .not("country", "is", null);

      const countryBreakdown = countryData?.reduce((acc, { country }) => {
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCountries = Object.entries(countryBreakdown || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Diagnostics usage
      const { count: totalDiagnostics } = await supabase
        .from("diagnostics")
        .select("*", { count: "exact", head: true });

      const { count: diagnosticsThisMonth } = await supabase
        .from("diagnostics")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      return {
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        newUsersToday: newUsersToday || 0,
        paidUsers: paidUsers?.length || 0,
        freeUsers: freeUsers || 0,
        conversionRate,
        topCountries,
        totalDiagnostics: totalDiagnostics || 0,
        diagnosticsThisMonth: diagnosticsThisMonth || 0,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor key metrics and growth</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 w-fit">
            <Radio className="w-3 h-3 text-green-500 animate-pulse" />
            Live: {realtimeStats.userCount} users, {realtimeStats.transactionCount} transactions
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.newUsersToday} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Users This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.newUsersThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    Growth momentum
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Free → Paid conversion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diagnostics This Month</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.diagnosticsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    Total: {analytics?.totalDiagnostics}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Paid Users</span>
                        <span className="text-sm text-muted-foreground">{analytics?.paidUsers}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ 
                            width: `${(analytics?.paidUsers || 0) / (analytics?.totalUsers || 1) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Free Users</span>
                        <span className="text-sm text-muted-foreground">{analytics?.freeUsers}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-muted-foreground"
                          style={{ 
                            width: `${(analytics?.freeUsers || 0) / (analytics?.totalUsers || 1) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.topCountries?.map(([country, count]) => (
                      <div key={country}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{country}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ 
                              width: `${(count / (analytics?.totalUsers || 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
