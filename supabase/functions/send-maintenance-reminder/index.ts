import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceReminderRequest {
  userId: string;
  applianceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, applianceId }: MaintenanceReminderRequest = await req.json();

    console.log("Processing maintenance reminder for user:", userId, "appliance:", applianceId);

    // Fetch user profile and check notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, notification_preferences")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has enabled maintenance reminders
    const prefs = profile.notification_preferences || {};
    if (!prefs.maintenance_reminders) {
      console.log("User has disabled maintenance reminders");
      return new Response(
        JSON.stringify({ message: "Notifications disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch appliance details
    const { data: appliance, error: applianceError } = await supabase
      .from("appliances")
      .select(`
        *,
        properties (name, address)
      `)
      .eq("id", applianceId)
      .single();

    if (applianceError || !appliance) {
      console.error("Error fetching appliance:", applianceError);
      return new Response(
        JSON.stringify({ error: "Appliance not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email sending with Resend - configure RESEND_API_KEY in Supabase secrets
    // const Resend = (await import("npm:resend@2.0.0")).Resend;
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Uncomment below to enable email sending once Resend is configured
    /*
    const emailResponse = await resend.emails.send({
      from: "FixSense <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Maintenance Reminder: ${appliance.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Maintenance Reminder</h1>
          <p>Hi ${profile.full_name || "there"},</p>
          <p>This is a friendly reminder that the following appliance needs maintenance soon:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937;">${appliance.name}</h2>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${appliance.type}</p>
            <p style="margin: 5px 0;"><strong>Brand:</strong> ${appliance.brand || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Property:</strong> ${appliance.properties?.name || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Next Maintenance:</strong> ${new Date(appliance.next_maintenance_date).toLocaleDateString()}</p>
          </div>
          
          <p>Regular maintenance helps prevent costly breakdowns and extends the life of your appliances.</p>
          
          <a href="${supabaseUrl}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View in Dashboard
          </a>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            You're receiving this because you have maintenance reminders enabled. 
            You can change your notification preferences in your account settings.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);
    */

    // Log the notification
    await supabase.from("notification_logs").insert({
      user_id: userId,
      notification_type: "maintenance_reminder",
      related_id: applianceId,
    });

    console.log("Maintenance reminder processed successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Reminder processed" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-maintenance-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
