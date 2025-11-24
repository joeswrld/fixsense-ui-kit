import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  maintenance_date: string;
  cost: number | null;
  notes: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  appliance: {
    name: string;
    type: string;
    property: {
      name: string;
    };
  };
}

export const MaintenanceTimeline = () => {
  const [sortBy, setSortBy] = useState<"date" | "cost">("date");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: history, isLoading } = useQuery({
    queryKey: ["maintenance-timeline"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("maintenance_history")
        .select(`
          id,
          maintenance_type,
          maintenance_date,
          cost,
          notes,
          before_photo_url,
          after_photo_url,
          appliances!inner (
            name,
            type,
            properties!inner (
              name,
              user_id
            )
          )
        `)
        .eq("user_id", user.id)
        .order("maintenance_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((record: any) => ({
        id: record.id,
        maintenance_type: record.maintenance_type,
        maintenance_date: record.maintenance_date,
        cost: record.cost,
        notes: record.notes,
        before_photo_url: record.before_photo_url,
        after_photo_url: record.after_photo_url,
        appliance: {
          name: record.appliances.name,
          type: record.appliances.type,
          property: {
            name: record.appliances.properties.name,
          },
        },
      })) as MaintenanceRecord[];
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

  // Filter records
  let filteredHistory = history || [];
  if (filterType !== "all") {
    filteredHistory = filteredHistory.filter((record) => 
      record.appliance.type.toLowerCase().includes(filterType.toLowerCase())
    );
  }

  // Sort records
  if (sortBy === "cost") {
    filteredHistory = [...filteredHistory].sort((a, b) => 
      (b.cost || 0) - (a.cost || 0)
    );
  } else {
    filteredHistory = [...filteredHistory].sort((a, b) => 
      new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime()
    );
  }

  const uniqueTypes = Array.from(new Set((history || []).map(r => r.appliance.type)));
  const totalCost = (history || []).reduce((sum, record) => sum + (record.cost || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Maintenance Timeline</CardTitle>
            <CardDescription>
              All completed maintenance across properties
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="w-3 h-3" />
            ${totalCost.toFixed(2)} Total
          </Badge>
        </div>
        <div className="flex gap-2 pt-4">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "cost")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="cost">Sort by Cost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No maintenance records yet</p>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((record, index) => (
              <div key={record.id} className="relative">
                {index !== filteredHistory.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative z-10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 border rounded-lg p-4 space-y-3 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{record.maintenance_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.appliance.name} • {record.appliance.property.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {record.appliance.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.maintenance_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      {record.cost && (
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="w-4 h-4" />
                          {record.cost.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-sm">{record.notes}</p>
                    )}
                    {(record.before_photo_url || record.after_photo_url) && (
                      <div className="grid grid-cols-2 gap-2">
                        {record.before_photo_url && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Before</p>
                            <img
                              src={record.before_photo_url}
                              alt="Before maintenance"
                              className="rounded-md w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        {record.after_photo_url && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">After</p>
                            <img
                              src={record.after_photo_url}
                              alt="After maintenance"
                              className="rounded-md w-full h-32 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
