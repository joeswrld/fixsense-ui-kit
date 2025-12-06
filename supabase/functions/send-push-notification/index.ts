import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  notification_type: 'critical_diagnostic' | 'maintenance_reminder' | 'warranty_expiration' | 'booking_confirmation' | 'weekly_summary';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, icon, url, notification_type }: PushNotificationRequest = await req.json();

    console.log(`Processing push notification for user ${user_id}: ${notification_type}`);

    // Get user's notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("notification_preferences, email")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    const preferences = profile?.notification_preferences || {};
    
    // Check if this notification type is enabled
    const shouldSend = checkNotificationPreference(preferences, notification_type);
    
    if (!shouldSend) {
      console.log(`Notification type ${notification_type} is disabled for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: "Notification type disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the notification
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id,
        notification_type,
        related_id: null,
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    // In a production environment, you would send the push notification here
    // using web-push library or a service like Firebase Cloud Messaging
    // For now, we log it and return success
    console.log(`Push notification prepared for user ${user_id}:`, {
      title,
      body,
      icon: icon || "/android-chrome-192x192.png",
      url: url || "/dashboard",
      notification_type,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Push notification processed",
        notification: {
          title,
          body,
          icon: icon || "/android-chrome-192x192.png",
          url: url || "/dashboard",
        }
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
