import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, Wrench, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VendorAnalyticsProps {
  vendorId: string;
}

export const VendorAnalytics = ({ vendorId }: VendorAnalyticsProps) => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats", vendorId],
    queryFn: async () => {
      const { data: maintenanceData } = await supabase
        .from("maintenance_history")
        .select("cost, maintenance_date")
        .eq("vendor_id", vendorId)
        .order("maintenance_date", { ascending: true });

      const { data: ratingsData } = await supabase
        .from("vendor_ratings")
        .select("rating, cost, service_date")
        .eq("vendor_id", vendorId);

      const totalServices = maintenanceData?.length || 0;
      const totalCost = maintenanceData?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;
      const avgRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;
      const ratingCount = ratingsData?.length || 0;

      // Aggregate costs by month for trend chart
      const costByMonth = (maintenanceData || []).reduce((acc: any, item) => {
        const month = new Date(item.maintenance_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += Number(item.cost) || 0;
        return acc;
      }, {});

      const chartData = Object.entries(costByMonth).map(([month, cost]) => ({
        month,
        cost: Number(cost),
      }));

      return {
        totalServices,
        totalCost,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingCount,
        chartData,
      };
    },
  });

  const { data: recentServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["vendor-services", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_history")
        .select(`
          id,
          maintenance_date,
          maintenance_type,
          cost,
          appliances (
            name,
            type,
            properties (
              name
            )
          )
        `)
        .eq("vendor_id", vendorId)
        .order("maintenance_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (statsLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{stats?.totalServices || 0}</p>
              </div>
              <Wrench className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">₦{stats?.totalCost.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats?.avgRating || 0}</p>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <Star className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ratings</p>
                <p className="text-2xl font-bold">{stats?.ratingCount || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend Chart */}
      {stats?.chartData && stats.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Trends Over Time</CardTitle>
            <CardDescription>Monthly service costs from this vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `₦${value.toLocaleString()}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>Latest maintenance work by this vendor</CardDescription>
        </CardHeader>
        <CardContent>
          {servicesLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !recentServices || recentServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No services recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentServices.map((service) => (
                <div key={service.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{service.appliances?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.appliances?.type} • {service.appliances?.properties?.name}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {service.maintenance_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ₦{Number(service.cost || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(service.maintenance_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
