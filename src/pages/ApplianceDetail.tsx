import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MaintenanceHistory } from "@/components/properties/MaintenanceHistory";
import { WarrantyManager } from "@/components/warranties/WarrantyManager";
import { PredictiveAlerts } from "@/components/predictive/PredictiveAlerts";

const ApplianceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: appliance, isLoading } = useQuery({
    queryKey: ["appliance", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("appliances")
        .select(`
          *,
          properties!inner (
            name,
            address,
            user_id
          )
        `)
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-accent/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appliance) {
    return (
      <div className="min-h-screen bg-accent/10">
        <AppHeader />
        <main className="container px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Appliance not found</h1>
            <Button onClick={() => navigate("/properties")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <Button variant="ghost" onClick={() => navigate("/properties")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
            <h1 className="text-3xl font-bold">{appliance.name}</h1>
            <p className="text-muted-foreground">
              {appliance.type} • {appliance.properties.name}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {appliance.brand && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Brand</dt>
                    <dd className="text-sm">{appliance.brand}</dd>
                  </div>
                )}
                {appliance.model && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                    <dd className="text-sm">{appliance.model}</dd>
                  </div>
                )}
                {appliance.purchase_date && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Purchase Date</dt>
                    <dd className="text-sm">
                      {new Date(appliance.purchase_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {appliance.status && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-sm capitalize">{appliance.status}</dd>
                  </div>
                )}
                {appliance.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                    <dd className="text-sm">{appliance.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <PredictiveAlerts applianceId={id!} />

          <WarrantyManager applianceId={id!} />

          <MaintenanceHistory applianceId={id!} />
        </div>
      </main>
    </div>
  );
};

export default ApplianceDetail;
