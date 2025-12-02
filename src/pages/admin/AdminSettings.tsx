import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminSettings = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState({
    videoDiagnostics: true,
    audioDiagnostics: true,
    predictiveMaintenance: true,
    diagnosticsGloballyEnabled: true,
  });

  const { data: adminLogs, isLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select(`
          *,
          profiles!admin_logs_admin_id_fkey(full_name, email),
          profiles!admin_logs_target_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const emergencyKillSwitch = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // In production, this would update a feature flag table
      setFeatures(prev => ({ ...prev, diagnosticsGloballyEnabled: enabled }));

      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "emergency_kill_switch",
        details: { enabled },
      });
    },
    onSuccess: (_, enabled) => {
      toast({ 
        title: enabled ? "Diagnostics Re-enabled" : "Emergency Kill Switch Activated",
        description: enabled 
          ? "All diagnostic features are now active"
          : "All diagnostic features have been disabled globally",
        variant: enabled ? "default" : "destructive"
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Manage global features and access controls</p>
        </div>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle>Emergency Controls</CardTitle>
            </div>
            <CardDescription>
              Critical system-wide controls for emergency situations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={features.diagnosticsGloballyEnabled ? "destructive" : "default"}
                  className="w-full md:w-auto"
                >
                  {features.diagnosticsGloballyEnabled 
                    ? "Activate Emergency Kill Switch" 
                    : "Re-enable All Diagnostics"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {features.diagnosticsGloballyEnabled 
                      ? "Disable All Diagnostics?" 
                      : "Re-enable All Diagnostics?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {features.diagnosticsGloballyEnabled
                      ? "This will immediately disable all diagnostic features for all users. Use only in emergency situations."
                      : "This will re-enable all diagnostic features for all users."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => emergencyKillSwitch.mutate(!features.diagnosticsGloballyEnabled)}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Controls</CardTitle>
            <CardDescription>
              Enable or disable features globally or per plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Video Diagnostics</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to upload video for diagnostics
                </p>
              </div>
              <Switch
                checked={features.videoDiagnostics}
                onCheckedChange={(checked) => 
                  setFeatures(prev => ({ ...prev, videoDiagnostics: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audio Diagnostics</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to upload audio for diagnostics
                </p>
              </div>
              <Switch
                checked={features.audioDiagnostics}
                onCheckedChange={(checked) => 
                  setFeatures(prev => ({ ...prev, audioDiagnostics: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Predictive Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered failure predictions
                </p>
              </div>
              <Switch
                checked={features.predictiveMaintenance}
                onCheckedChange={(checked) => 
                  setFeatures(prev => ({ ...prev, predictiveMaintenance: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>Admin Activity Log</CardTitle>
            </div>
            <CardDescription>
              Recent administrative actions for compliance and audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {adminLogs?.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.profiles?.full_name || log.profiles?.email}</span>
                        <span className="text-sm text-muted-foreground">
                          performed {log.action.replace(/_/g, " ")}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
