import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, Wrench, ArrowLeft, Loader2, History } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AddPropertyDialog } from "@/components/properties/AddPropertyDialog";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { AppHeader } from "@/components/AppHeader";
import { MaintenanceTimeline } from "@/components/properties/MaintenanceTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Property {
  id: string;
  name: string;
  address: string | null;
}

interface Appliance {
  id: string;
  property_id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  notes: string | null;
}

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;

      const { data: appliancesData, error: appliancesError } = await supabase
        .from("appliances")
        .select("*")
        .order("created_at", { ascending: false });

      if (appliancesError) throw appliancesError;

      setProperties(propertiesData || []);
      setAppliances(appliancesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAppliancesForProperty = (propertyId: string) => {
    return appliances.filter(a => a.property_id === propertyId);
  };

  return (
    <div className="min-h-screen bg-accent/10">
     <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold">Properties</h1>
              <p className="text-muted-foreground">Manage your properties and appliances</p>
            </div>
            <Button onClick={() => setAddPropertyOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : properties.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                  <p className="mb-6">Start by adding your first property to track appliances and maintenance</p>
                  <Button onClick={() => setAddPropertyOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Property
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="properties" className="space-y-6">
              <TabsList>
                <TabsTrigger value="properties" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <History className="w-4 h-4" />
                  Maintenance History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-6">
                <div className="grid gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      appliances={getAppliancesForProperty(property.id)}
                      onUpdate={fetchData}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <MaintenanceTimeline />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AddPropertyDialog
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onPropertyAdded={fetchData}
      />
    </div>
  );
};

export default Properties;