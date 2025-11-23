import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, ArrowLeft, Calendar, Filter, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";

interface Diagnostic {
  id: string;
  diagnosis_summary: string;
  urgency: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  created_at: string;
  property_id: string | null;
  appliance_id: string | null;
  properties: { name: string } | null;
  appliances: { name: string; type: string } | null;
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [filteredDiagnostics, setFilteredDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [diagnostics, propertyFilter, urgencyFilter, dateFilter]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: diagnosticsData, error: diagnosticsError } = await supabase
        .from("diagnostics")
        .select(`
          *,
          properties (name),
          appliances (name, type)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (diagnosticsError) throw diagnosticsError;

      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id);

      if (propertiesError) throw propertiesError;

      setDiagnostics(diagnosticsData || []);
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load diagnostic history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...diagnostics];

    if (propertyFilter !== "all") {
      filtered = filtered.filter(d => d.property_id === propertyFilter);
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter(d => d.urgency === urgencyFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(d => new Date(d.created_at) >= filterDate);
    }

    setFilteredDiagnostics(filtered);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge variant="destructive">Warning</Badge>;
      case "safe":
        return <Badge variant="default">Safe</Badge>;
      default:
        return <Badge variant="default">{urgency}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Diagnostic History</h1>
            <p className="text-muted-foreground">View and filter all your past diagnostic reports</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency Level</label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredDiagnostics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No diagnostics found with the selected filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredDiagnostics.map((diagnostic) => (
                <Card
                  key={diagnostic.id}
                  className="cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => navigate(`/result/${diagnostic.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">
                          {diagnostic.appliances?.name || "General Diagnostic"}
                        </CardTitle>
                        <CardDescription>
                          {diagnostic.properties?.name && `${diagnostic.properties.name} • `}
                          {new Date(diagnostic.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      {getUrgencyBadge(diagnostic.urgency)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {diagnostic.diagnosis_summary}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {diagnostic.appliances?.type && `Type: ${diagnostic.appliances.type}`}
                      </span>
                      <span className="font-semibold text-primary">
                        ${diagnostic.estimated_cost_min} - ${diagnostic.estimated_cost_max}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;
