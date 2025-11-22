import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CriticalAlertRequest {
  userId: string;
  diagnosticId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, diagnosticId }: CriticalAlertRequest = await req.json();

    console.log("Processing critical alert for user:", userId, "diagnostic:", diagnosticId);

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

    // Check if user has enabled critical diagnostic alerts
    const prefs = profile.notification_preferences || {};
    if (!prefs.critical_diagnostics) {
      console.log("User has disabled critical diagnostic alerts");
      return new Response(
        JSON.stringify({ message: "Notifications disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch diagnostic details
    const { data: diagnostic, error: diagnosticError } = await supabase
      .from("diagnostics")
      .select(`
        *,
        appliances (name, type),
        properties (name)
      `)
      .eq("id", diagnosticId)
      .single();

    if (diagnosticError || !diagnostic) {
      console.error("Error fetching diagnostic:", diagnosticError);
      return new Response(
        JSON.stringify({ error: "Diagnostic not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only send if urgency is critical or warning
    if (diagnostic.urgency !== "critical" && diagnostic.urgency !== "warning") {
      console.log("Diagnostic is not critical or warning, skipping alert");
      return new Response(
        JSON.stringify({ message: "Not a critical diagnostic" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email sending with Resend - configure RESEND_API_KEY in Supabase secrets
    // const Resend = (await import("npm:resend@2.0.0")).Resend;
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Uncomment below to enable email sending once Resend is configured
    /*
    const urgencyColor = diagnostic.urgency === "critical" ? "#dc2626" : "#f59e0b";
    const urgencyLabel = diagnostic.urgency === "critical" ? "CRITICAL" : "WARNING";

    const emailResponse = await resend.emails.send({
      from: "FixSense <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${urgencyLabel}: ${diagnostic.appliances?.name || "Appliance"} Needs Attention`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">${urgencyLabel} Alert</h1>
          </div>
          
          <div style="padding: 20px; border: 2px solid ${urgencyColor}; border-radius: 0 0 8px 8px;">
            <p>Hi ${profile.full_name || "there"},</p>
            <p>Your recent diagnostic has detected a ${diagnostic.urgency} issue that needs your attention:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${diagnostic.appliances ? `
                <h2 style="margin: 0 0 10px 0; color: #1f2937;">${diagnostic.appliances.name}</h2>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${diagnostic.appliances.type}</p>
              ` : ''}
              ${diagnostic.properties ? `
                <p style="margin: 5px 0;"><strong>Property:</strong> ${diagnostic.properties.name}</p>
              ` : ''}
              <h3 style="color: ${urgencyColor}; margin: 15px 0 10px 0;">Diagnosis</h3>
              <p style="margin: 5px 0;">${diagnostic.diagnosis_summary}</p>
              
              ${diagnostic.estimated_cost_min && diagnostic.estimated_cost_max ? `
                <h3 style="margin: 15px 0 10px 0;">Estimated Cost</h3>
                <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #2563eb;">
                  $${diagnostic.estimated_cost_min} - $${diagnostic.estimated_cost_max}
                </p>
              ` : ''}
            </div>
            
            <a href="${supabaseUrl}/result/${diagnosticId}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Full Report
            </a>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);
    */

    // Log the notification
    await supabase.from("notification_logs").insert({
      user_id: userId,
      notification_type: "critical_diagnostic",
      related_id: diagnosticId,
    });

    console.log("Critical alert processed successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Alert processed" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-critical-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
