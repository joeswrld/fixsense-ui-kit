import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Sparkles, X, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PredictiveAlertsProps {
  applianceId?: string;
}

export const PredictiveAlerts = ({ applianceId }: PredictiveAlertsProps) => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["predictive-alerts", applianceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("predictive_alerts")
        .select(`
          *,
          appliances!inner (
            name,
            type,
            properties!inner (
              name,
              user_id
            )
          )
        `)
        .eq("dismissed", false)
        .order("confidence_score", { ascending: false });

      if (applianceId) {
        query = query.eq("appliance_id", applianceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const generatePredictionMutation = useMutation({
    mutationFn: async (applianceId: string) => {
      const { data, error } = await supabase.functions.invoke("predict-maintenance", {
        body: { applianceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictive-alerts"] });
      toast.success("AI prediction generated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate prediction");
      console.error(error);
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("predictive_alerts")
        .update({ dismissed: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictive-alerts"] });
      toast.success("Alert dismissed");
    },
    onError: (error) => {
      toast.error("Failed to dismiss alert");
      console.error(error);
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Predictive Maintenance Alerts
            </CardTitle>
            <CardDescription>AI-powered failure predictions and recommendations</CardDescription>
          </div>
          {applianceId && (
            <Button
              onClick={() => generatePredictionMutation.mutate(applianceId)}
              disabled={generatePredictionMutation.isPending}
              variant="outline"
            >
              {generatePredictionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Prediction
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No predictive alerts at this time</p>
            {applianceId && (
              <p className="text-sm mt-2">Click "Generate Prediction" to analyze maintenance patterns</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{alert.prediction_type}</h3>
                      {getSeverityBadge(alert.severity)}
                      <Badge variant="outline" className="text-xs">
                        {alert.confidence_score}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.appliances.name} • {alert.appliances.properties.name}
                    </p>
                    {alert.predicted_failure_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Predicted: {new Date(alert.predicted_failure_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissAlertMutation.mutate(alert.id)}
                    disabled={dismissAlertMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-accent/30 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">Recommendation:</p>
                  <p className="text-sm">{alert.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
