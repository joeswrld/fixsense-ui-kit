import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Wrench, Calendar, DollarSign, AlertTriangle, CheckCircle2, AlertCircle, Stethoscope, Pencil } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MaintenanceHistory } from "@/components/properties/MaintenanceHistory";
import { WarrantyManager } from "@/components/warranties/WarrantyManager";
import { PredictiveAlerts } from "@/components/predictive/PredictiveAlerts";
import { Progress } from "@/components/ui/progress";
import { EditApplianceDialog } from "@/components/properties/EditApplianceDialog";
import { RepairVsReplaceCalculator } from "@/components/properties/RepairVsReplaceCalculator";

const EXPECTED_LIFESPAN: Record<string, number> = {
  "Air Conditioner": 15, "Refrigerator": 15, "Washing Machine": 12,
  "Dryer": 13, "Dishwasher": 10, "Oven": 15, "Microwave": 10,
  "Water Heater": 12, "Generator": 20, "Ceiling Fan": 15,
  "Freezer": 15, "Electric Cooker": 12, "Television": 8, "Other": 10,
};

const statusConfig = {
  good: { icon: CheckCircle2, label: "Good", color: "text-green-500", bg: "bg-green-500/10" },
  warning: { icon: AlertTriangle, label: "Needs Attention", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  critical: { icon: AlertCircle, label: "Critical", color: "text-destructive", bg: "bg-destructive/10" },
};

const ApplianceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: appliance, isLoading } = useQuery({
    queryKey: ["appliance", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("appliances")
        .select(`*, properties!inner (id, name, address, user_id)`)
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: totalCost } = useQuery({
    queryKey: ["appliance-total-cost", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_history")
        .select("cost")
        .eq("appliance_id", id!);
      if (error) throw error;
      return data?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
    },
    enabled: !!id,
  });

  const { data: diagnosticCount } = useQuery({
    queryKey: ["appliance-diagnostic-count", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id", { count: "exact" })
        .eq("appliance_id", id!);
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!id,
  });

  const handleApplianceUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["appliance", id] });
  };

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

  const status = statusConfig[appliance.status as keyof typeof statusConfig] || statusConfig.good;
  const StatusIcon = status.icon;

  const purchaseDate = appliance.purchase_date ? new Date(appliance.purchase_date) : null;
  const ageYears = purchaseDate
    ? Math.round((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10
    : null;
  const expectedLifespan = EXPECTED_LIFESPAN[appliance.type] || 10;
  const lifespanPercent = ageYears !== null ? Math.min(100, Math.round((ageYears / expectedLifespan) * 100)) : null;

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" onClick={() => navigate("/properties")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Properties
              </Button>
              <div className="flex items-center gap-3">
                {appliance.photo_url && (
                  <img src={appliance.photo_url} alt={appliance.name} className="w-16 h-16 rounded-lg object-cover border" />
                )}
                <div>
                  <h1 className="text-3xl font-bold">{appliance.name}</h1>
                  <p className="text-muted-foreground">
                    {appliance.type} • {appliance.properties.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => navigate(`/diagnose?propertyId=${appliance.properties.id}&applianceId=${appliance.id}`)}
                size="lg"
              >
                <Stethoscope className="w-5 h-5 mr-2" />
                Diagnose
              </Button>
            </div>
          </div>

          {/* Health Status Banner */}
          <Card className={`border-l-4 ${status.color === "text-green-500" ? "border-l-green-500" : status.color === "text-yellow-500" ? "border-l-yellow-500" : "border-l-destructive"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bg}`}>
                  <StatusIcon className={`w-6 h-6 ${status.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Health Status: {status.label}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{appliance.status || "good"} condition</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-semibold">{ageYears !== null ? `${ageYears} yrs` : "Unknown"}</p>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <Wrench className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Expected Lifespan</p>
                  <p className="font-semibold">{expectedLifespan} yrs</p>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Repair Cost</p>
                  <p className="font-semibold">₦{(totalCost || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <Stethoscope className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Diagnostics Run</p>
                  <p className="font-semibold">{diagnosticCount || 0}</p>
                </div>
              </div>

              {lifespanPercent !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Lifespan Used</span>
                    <span className={`font-medium ${lifespanPercent >= 80 ? "text-destructive" : lifespanPercent >= 60 ? "text-yellow-500" : "text-green-500"}`}>
                      {lifespanPercent}%
                    </span>
                  </div>
                  <Progress value={lifespanPercent} className="h-2" />
                  {lifespanPercent >= 80 && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      This appliance is nearing the end of its expected lifespan. Consider replacement planning.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appliance Details */}
          <Card>
            <CardHeader>
              <CardTitle>Appliance Details</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <dd className="text-sm">{new Date(appliance.purchase_date).toLocaleDateString()}</dd>
                  </div>
                )}
                {appliance.next_maintenance_date && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Next Maintenance</dt>
                    <dd className="text-sm">{new Date(appliance.next_maintenance_date).toLocaleDateString()}</dd>
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

          {/* Repair vs Replace Calculator */}
          <RepairVsReplaceCalculator
            applianceType={appliance.type}
            totalRepairCost={totalCost || 0}
            purchaseDate={appliance.purchase_date}
          />

          <PredictiveAlerts applianceId={id!} />
          <WarrantyManager applianceId={id!} />
          <MaintenanceHistory applianceId={id!} />
        </div>
      </main>

      <EditApplianceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        appliance={appliance}
        onApplianceUpdated={handleApplianceUpdated}
      />
    </div>
  );
};

export default ApplianceDetail;
