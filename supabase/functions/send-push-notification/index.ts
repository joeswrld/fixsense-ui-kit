import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  notification_type: 'critical_diagnostic' | 'maintenance_reminder' | 'warranty_expiration' | 'booking_confirmation' | 'weekly_summary';
  send_to_all?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, icon, url, notification_type, send_to_all }: PushNotificationRequest = await req.json();

    console.log(`Processing push notification: ${notification_type}`, { user_id, send_to_all });

    let usersToNotify: any[] = [];

    if (send_to_all) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, notification_preferences, push_subscription, email")
        .not("push_subscription", "is", null);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      usersToNotify = profiles || [];
    } else if (user_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, notification_preferences, push_subscription, email")
        .eq("id", user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (profile) {
        usersToNotify = [profile];
      }
    } else {
      throw new Error("Either user_id or send_to_all must be provided");
    }

    let successCount = 0;

    for (const profile of usersToNotify) {
      const preferences = profile?.notification_preferences || {};
      
      const shouldSend = checkNotificationPreference(preferences, notification_type);
      
      if (!shouldSend) {
        console.log(`Notification type ${notification_type} is disabled for user ${profile.id}`);
        continue;
      }

      if (!profile.push_subscription) {
        console.log(`No push subscription for user ${profile.id}`);
        continue;
      }

      // Log the notification for delivery
      console.log(`Push notification prepared for user ${profile.id}:`, {
        title,
        body,
        icon: icon || "/android-chrome-192x192.png",
        url: url || "/dashboard",
      });

      await supabase
        .from("notification_logs")
        .insert({
          user_id: profile.id,
          notification_type,
          related_id: null,
        });

      successCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notifications processed: ${successCount} prepared`,
        sent: successCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function checkNotificationPreference(preferences: any, notificationType: string): boolean {
  if (preferences.push_enabled === false) {
    return false;
  }
  
  switch (notificationType) {
    case 'critical_diagnostic':
      return preferences.critical_diagnostics !== false;
    case 'maintenance_reminder':
      return preferences.maintenance_reminders !== false;
    case 'warranty_expiration':
      return preferences.warranty_expiration !== false;
    case 'booking_confirmation':
      return preferences.booking_confirmations !== false;
    case 'weekly_summary':
      return preferences.weekly_summary !== false;
    default:
      return true;
  }
}

serve(handler);