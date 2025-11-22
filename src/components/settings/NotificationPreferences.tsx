import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const NotificationPreferences = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    maintenance_reminders: true,
    critical_diagnostics: true,
    weekly_summary: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as any);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: preferences })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-reminders" className="text-base">
              Maintenance Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when appliances need scheduled maintenance
            </p>
          </div>
          <Switch
            id="maintenance-reminders"
            checked={preferences.maintenance_reminders}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, maintenance_reminders: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="critical-diagnostics" className="text-base">
              Critical Diagnostic Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive immediate alerts for critical appliance issues
            </p>
          </div>
          <Switch
            id="critical-diagnostics"
            checked={preferences.critical_diagnostics}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, critical_diagnostics: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-summary" className="text-base">
              Weekly Summary
            </Label>
            <p className="text-sm text-muted-foreground">
              Get a weekly digest of your property maintenance status
            </p>
          </div>
          <Switch
            id="weekly-summary"
            checked={preferences.weekly_summary}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, weekly_summary: checked })
            }
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};
