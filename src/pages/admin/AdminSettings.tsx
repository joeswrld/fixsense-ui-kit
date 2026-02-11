import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  video_diagnostics: { label: "Video Diagnostics", description: "Allow users to upload video for diagnostics" },
  audio_diagnostics: { label: "Audio Diagnostics", description: "Allow users to upload audio for diagnostics" },
  predictive_maintenance: { label: "AI Predictive Maintenance", description: "Enable AI-powered failure predictions" },
};

const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("flag_key");
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const { data: adminLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Fetch admin profile names separately to avoid FK join issues
      const adminIds = [...new Set(data.map((l: any) => l.admin_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return data.map((log: any) => ({
        ...log,
        admin_profile: profileMap.get(log.admin_id) || null,
      }));
    },
  });

  const killSwitchFlag = featureFlags?.find(f => f.flag_key === "diagnostics_globally_enabled");
  const isGloballyEnabled = killSwitchFlag?.enabled ?? true;

  const toggleFeature = useMutation({
    mutationFn: async ({ flagKey, enabled }: { flagKey: string; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled, updated_by: user.id })
        .eq("flag_key", flagKey);
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "toggle_feature",
        details: { flag_key: flagKey, enabled },
      });
    },
    onSuccess: (_, { flagKey, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      const label = FEATURE_LABELS[flagKey]?.label || flagKey;
      toast({ title: `${label} ${enabled ? "enabled" : "disabled"}` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const emergencyKillSwitch = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled, updated_by: user.id })
        .eq("flag_key", "diagnostics_globally_enabled");
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "emergency_kill_switch",
        details: { enabled },
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      toast({
        title: enabled ? "Diagnostics Re-enabled" : "Emergency Kill Switch Activated",
        description: enabled
          ? "All diagnostic features are now active"
          : "All diagnostic features have been disabled globally",
        variant: enabled ? "default" : "destructive",
      });
    },
  });

  const featureToggles = featureFlags?.filter(f => f.flag_key !== "diagnostics_globally_enabled") || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage global features and access controls</p>
        </div>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-lg">Emergency Controls</CardTitle>
            </div>
            <CardDescription>
              Critical system-wide controls for emergency situations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Status: {isGloballyEnabled
                    ? <span className="text-green-600">All Diagnostics Active</span>
                    : <span className="text-destructive font-bold">⚠️ Kill Switch ACTIVE — All Diagnostics Disabled</span>}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={isGloballyEnabled ? "destructive" : "default"}
                    className="w-full sm:w-auto"
                    disabled={emergencyKillSwitch.isPending}
                  >
                    {emergencyKillSwitch.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isGloballyEnabled
                      ? "Activate Emergency Kill Switch"
                      : "Re-enable All Diagnostics"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isGloballyEnabled
                        ? "Disable All Diagnostics?"
                        : "Re-enable All Diagnostics?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isGloballyEnabled
                        ? "This will immediately disable all diagnostic features for all users. Use only in emergency situations."
                        : "This will re-enable all diagnostic features for all users."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => emergencyKillSwitch.mutate(!isGloballyEnabled)}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Controls</CardTitle>
            <CardDescription>
              Enable or disable features globally
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {flagsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              featureToggles.map((flag) => {
                const meta = FEATURE_LABELS[flag.flag_key];
                return (
                  <div key={flag.id} className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>{meta?.label || flag.flag_key}</Label>
                      <p className="text-sm text-muted-foreground">
                        {meta?.description || flag.description}
                      </p>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      disabled={toggleFeature.isPending}
                      onCheckedChange={(checked) =>
                        toggleFeature.mutate({ flagKey: flag.flag_key, enabled: checked })
                      }
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle className="text-lg">Admin Activity Log</CardTitle>
            </div>
            <CardDescription>
              Recent administrative actions for compliance and audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : adminLogs?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No admin actions recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {adminLogs?.slice(0, 20).map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-medium text-sm truncate">
                          {log.admin_profile?.full_name || log.admin_profile?.email || "Unknown Admin"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          performed <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {typeof log.details === "object"
                            ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")
                            : JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
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
