import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, BellRing } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationPrefs {
  maintenance_reminders: boolean;
  warranty_expiration: boolean;
  critical_diagnostics: boolean;
  weekly_summary: boolean;
  booking_confirmations: boolean;
  push_enabled?: boolean;
}

export const NotificationPreferences = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    maintenance_reminders: true,
    warranty_expiration: true,
    critical_diagnostics: true,
    weekly_summary: false,
    booking_confirmations: true,
  });

  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Real-time subscription for settings updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notification-prefs-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.new.notification_preferences) {
            setPreferences(payload.new.notification_preferences as unknown as NotificationPrefs);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as unknown as NotificationPrefs);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: newPreferences })
        .eq("id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving preference:", error);
      // Revert on error
      setPreferences(preferences);
      toast({
        title: t('common.error'),
        description: "Failed to update preference",
        variant: "destructive",
      });
    }
  }, [preferences, toast, t]);

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
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
    <div className="space-y-6">
      {/* Push Notifications */}
      {isSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              {t('settings.notifications.pushTitle')}
            </CardTitle>
            <CardDescription>{t('settings.notifications.pushDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{t('settings.notifications.enablePush')}</Label>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed ? 'Push notifications are enabled' : 'Enable browser push notifications'}
                </p>
              </div>
              <Button
                variant={isSubscribed ? "outline" : "default"}
                size="sm"
                onClick={handlePushToggle}
                disabled={pushLoading}
              >
                {pushLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubscribed ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('settings.notifications.emailTitle')}
          </CardTitle>
          <CardDescription>{t('settings.notifications.emailDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-reminders" className="text-base">
                {t('settings.notifications.maintenanceReminders')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.maintenanceRemindersDesc')}
              </p>
            </div>
            <Switch
              id="maintenance-reminders"
              checked={preferences.maintenance_reminders}
              onCheckedChange={(checked) => updatePreference('maintenance_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="warranty-expiration" className="text-base">
                {t('settings.notifications.warrantyExpiration')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.warrantyExpirationDesc')}
              </p>
            </div>
            <Switch
              id="warranty-expiration"
              checked={preferences.warranty_expiration}
              onCheckedChange={(checked) => updatePreference('warranty_expiration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical-diagnostics" className="text-base">
                {t('settings.notifications.criticalDiagnostics')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.criticalDiagnosticsDesc')}
              </p>
            </div>
            <Switch
              id="critical-diagnostics"
              checked={preferences.critical_diagnostics}
              onCheckedChange={(checked) => updatePreference('critical_diagnostics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary" className="text-base">
                {t('settings.notifications.weeklySummary')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.weeklySummaryDesc')}
              </p>
            </div>
            <Switch
              id="weekly-summary"
              checked={preferences.weekly_summary}
              onCheckedChange={(checked) => updatePreference('weekly_summary', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="booking-confirmations" className="text-base">
                {t('settings.notifications.bookingConfirmations')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.bookingConfirmationsDesc')}
              </p>
            </div>
            <Switch
              id="booking-confirmations"
              checked={preferences.booking_confirmations}
              onCheckedChange={(checked) => updatePreference('booking_confirmations', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
