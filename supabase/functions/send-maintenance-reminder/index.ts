import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceReminderRequest {
  applianceId?: string;
}

interface MaintenanceReminder {
  user_email: string;
  appliance_name: string;
  appliance_type: string;
  property_name: string;
  maintenance_date: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let applianceId: string | undefined;
    
    // Check if this is a cron job (no body) or a direct call (with applianceId)
    try {
      const body = await req.json();
      applianceId = body.applianceId;
    } catch {
      // No body means it's a cron job
      console.log("Running as scheduled cron job");
    }

    let appliances: any[] = [];

    if (applianceId) {
      // Direct call for specific appliance
      const { data, error } = await supabase
        .from('appliances')
        .select(`
          id,
          name,
          type,
          brand,
          next_maintenance_date,
          properties (
            id,
            name,
            address,
            user_id
          )
        `)
        .eq('id', applianceId)
        .single();

      if (error) {
        console.error("Error fetching appliance:", error);
        return new Response(
          JSON.stringify({ error: "Appliance not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      appliances = [data];
      console.log("Processing maintenance reminder for appliance:", applianceId);
    } else {
      // Cron job: fetch all appliances due in next 7 days
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('appliances')
        .select(`
          id,
          name,
          type,
          brand,
          next_maintenance_date,
          properties (
            id,
            name,
            address,
            user_id
          )
        `)
        .gte('next_maintenance_date', today.toISOString().split('T')[0])
        .lte('next_maintenance_date', sevenDaysFromNow.toISOString().split('T')[0]);

      if (error) throw error;
      appliances = data || [];
      console.log(`Found ${appliances.length} appliances due for maintenance in next 7 days`);
    }

    const reminders: MaintenanceReminder[] = [];

    for (const appliance of appliances) {
      // Fetch user profile with notification preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name, notification_preferences')
        .eq('id', appliance.properties.user_id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        continue;
      }

      // Check if user wants maintenance reminders
      const prefs = profile.notification_preferences || {};
      if (!prefs.maintenance_reminders) {
        console.log("User has disabled maintenance reminders");
        continue;
      }

      reminders.push({
        user_email: profile.email,
        appliance_name: appliance.name,
        appliance_type: appliance.type,
        property_name: appliance.properties.name,
        maintenance_date: appliance.next_maintenance_date,
      });

      console.log(`Reminder prepared for: ${profile.email} - ${appliance.name}`);

      // Log notification
      await supabase.from("notification_logs").insert({
        user_id: appliance.properties.user_id,
        notification_type: "maintenance_reminder",
        related_id: appliance.id,
      });
    }

    // TODO: Email sending with Resend - uncomment once RESEND_API_KEY is configured
    /*
    const Resend = (await import("npm:resend@2.0.0")).Resend;
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    for (const reminder of reminders) {
      await resend.emails.send({
        from: "FixSense <maintenance@fixsense.app>",
        to: [reminder.user_email],
        subject: `Maintenance Reminder: ${reminder.appliance_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Maintenance Reminder</h1>
            <p>This is a friendly reminder that the following appliance needs maintenance soon:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1f2937;">${reminder.appliance_name}</h2>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${reminder.appliance_type}</p>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${reminder.property_name}</p>
              <p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${new Date(reminder.maintenance_date).toLocaleDateString()}</p>
            </div>
            
            <p>Regular maintenance helps prevent costly breakdowns and extends the life of your appliances.</p>
            
            <a href="${supabaseUrl}/calendar" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Calendar
            </a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can change your notification preferences in your account settings.
            </p>
          </div>
        `,
      });
    }
    */

    console.log("Maintenance reminders processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Maintenance reminders processed successfully",
        count: reminders.length,
        reminders 
      }),
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
