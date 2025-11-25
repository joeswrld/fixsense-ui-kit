import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, Wrench, ArrowLeft, Loader2, History, AlertTriangle, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddPropertyDialog } from "@/components/properties/AddPropertyDialog";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { AppHeader } from "@/components/AppHeader";
import { MaintenanceTimeline } from "@/components/properties/MaintenanceTimeline";
import { VendorDirectory } from "@/components/vendors/VendorDirectory";
import { PredictiveAlerts } from "@/components/predictive/PredictiveAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUsageEnforcement } from "@/hooks/useUsageEnforcement";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const { checkUsage, isLoading: usageLoading, tier, refetchUsage } = useUsageEnforcement();

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

  const propertyCheck = checkUsage('property');

  const handleAddPropertyClick = () => {
    if (propertyCheck.isAtLimit) {
      toast({
        title: "Property Limit Reached",
        description: `You've reached your limit of ${propertyCheck.limit} ${propertyCheck.limit === 1 ? 'property' : 'properties'}. Upgrade your plan to add more properties.`,
        variant: "destructive",
      });
      return;
    }
    setAddPropertyOpen(true);
  };

  const handlePropertyAdded = async () => {
    await fetchData();
    await refetchUsage();
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Properties</h1>
                <Badge variant="outline" className="capitalize">
                  {tier} Plan
                </Badge>
              </div>
              <p className="text-muted-foreground">Manage your properties and appliances</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className={`font-medium ${
                  propertyCheck.isAtLimit ? 'text-red-600' : 
                  propertyCheck.remaining <= 1 ? 'text-yellow-600' : 
                  'text-muted-foreground'
                }`}>
                  {propertyCheck.usage} / {propertyCheck.limit} properties
                </p>
                <p className="text-xs text-muted-foreground">
                  {propertyCheck.remaining} remaining
                </p>
              </div>
              <Button 
                onClick={handleAddPropertyClick}
                disabled={propertyCheck.isAtLimit || usageLoading}
              >
                {propertyCheck.isAtLimit ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Limit Reached
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </>
                )}
              </Button>
            </div>
          </div>

          {propertyCheck.isAtLimit && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-red-800 font-medium">
                    You've reached your property limit ({propertyCheck.limit} {propertyCheck.limit === 1 ? 'property' : 'properties'}).
                  </span>
                  <p className="text-sm text-red-700 mt-1">
                    Upgrade to Pro (5 properties) or Business (30 properties) to add more.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/settings?tab=billing')}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {propertyCheck.remaining === 1 && !propertyCheck.isAtLimit && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-yellow-800">
                  You have 1 property slot remaining. Upgrade for more capacity.
                </span>
                <Button size="sm" variant="outline" onClick={() => navigate('/settings?tab=billing')}>
                  <Crown className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
                  {propertyCheck.canUse ? (
                    <Button onClick={handleAddPropertyClick}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Property
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-600 font-medium">
                        You've reached your property limit
                      </p>
                      <Button onClick={() => navigate('/settings?tab=billing')}>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Add Properties
                      </Button>
                    </div>
                  )}
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
                <TabsTrigger value="vendors" className="gap-2">
                  <Wrench className="w-4 h-4" />
                  Vendors
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  AI Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-6">
                {tier === 'free' && !propertyCheck.isAtLimit && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <h3 className="font-semibold text-lg mb-1">Need More Properties?</h3>
                          <p className="text-sm text-muted-foreground">
                            Upgrade to Pro for 5 properties or Business for 30 properties
                          </p>
                        </div>
                        <Button size="lg" onClick={() => navigate('/settings?tab=billing')} className="flex-shrink-0">
                          <Crown className="w-4 h-4 mr-2" />
                          View Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      appliances={getAppliancesForProperty(property.id)}
                      onUpdate={handlePropertyAdded}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <MaintenanceTimeline />
              </TabsContent>

              <TabsContent value="vendors">
                <VendorDirectory />
              </TabsContent>

              <TabsContent value="alerts">
                <PredictiveAlerts />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AddPropertyDialog
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onPropertyAdded={handlePropertyAdded}
      />
    </div>
  );
};

export default Properties;