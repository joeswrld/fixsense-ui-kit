import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Helper function to send email via Resend API
const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FixSense <notifications@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  return response.json();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: "new_subscriber" | "churn" | "system_error" | "failed_diagnostic";
  data: {
    userEmail?: string;
    userName?: string;
    plan?: string;
    amount?: number;
    errorMessage?: string;
    details?: string;
  };
}

const ADMIN_EMAILS = ["admin@fixsense.com"]; // Configure admin emails

const getEmailSubject = (type: string): string => {
  const subjects: Record<string, string> = {
    new_subscriber: "🎉 New Paid Subscriber on FixSense",
    churn: "⚠️ User Cancelled Subscription",
    system_error: "🚨 System Error Detected",
    failed_diagnostic: "❌ Diagnostic Failed",
  };
  return subjects[type] || "FixSense Admin Notification";
};

const getEmailContent = (type: string, data: AdminNotificationRequest["data"]): string => {
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Africa/Lagos",
  });

  switch (type) {
    case "new_subscriber":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">🎉 New Paid Subscriber!</h1>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${data.userName || "N/A"}</p>
            <p><strong>Email:</strong> ${data.userEmail || "N/A"}</p>
            <p><strong>Plan:</strong> ${data.plan || "N/A"}</p>
            <p><strong>Amount:</strong> ₦${data.amount?.toLocaleString() || "N/A"}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${timestamp}</p>
        </div>
      `;

    case "churn":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">⚠️ User Cancelled Subscription</h1>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${data.userName || "N/A"}</p>
            <p><strong>Email:</strong> ${data.userEmail || "N/A"}</p>
            <p><strong>Previous Plan:</strong> ${data.plan || "N/A"}</p>
            <p><strong>Reason:</strong> ${data.details || "Not provided"}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${timestamp}</p>
          <p style="color: #6b7280; margin-top: 20px;">
            Consider reaching out to understand why they left and if there's anything we can do.
          </p>
        </div>
      `;

    case "system_error":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">🚨 System Error Detected</h1>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Error:</strong> ${data.errorMessage || "Unknown error"}</p>
            <p><strong>Details:</strong></p>
            <pre style="background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto;">
${data.details || "No additional details"}
            </pre>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${timestamp}</p>
          <p style="color: #ef4444; font-weight: bold; margin-top: 20px;">
            Immediate attention may be required.
          </p>
        </div>
      `;

    case "failed_diagnostic":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">❌ Diagnostic Failed</h1>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${data.userEmail || "N/A"}</p>
            <p><strong>Error:</strong> ${data.errorMessage || "Unknown error"}</p>
            <p><strong>Details:</strong> ${data.details || "No details available"}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${timestamp}</p>
        </div>
      `;

    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>FixSense Notification</h1>
          <p>${JSON.stringify(data)}</p>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${timestamp}</p>
        </div>
      `;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: AdminNotificationRequest = await req.json();

    console.log("Sending admin notification:", type, data);

    // Get admin emails from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
    }

    let adminEmails = [...ADMIN_EMAILS];

    if (adminRoles && adminRoles.length > 0) {
      const adminIds = adminRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("id", adminIds);

      if (profiles) {
        adminEmails = [...adminEmails, ...profiles.map((p) => p.email).filter(Boolean)];
      }
    }

    // Remove duplicates
    adminEmails = [...new Set(adminEmails)].filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.warn("No admin emails configured");
      return new Response(
        JSON.stringify({ success: false, message: "No admin emails configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email to all admins
    const emailResponse = await sendEmail(
      adminEmails,
      getEmailSubject(type),
      getEmailContent(type, data)
    );

    console.log("Email sent:", emailResponse);

    // Log the notification
    await supabase.from("admin_logs").insert({
      admin_id: adminRoles?.[0]?.user_id || "system",
      action: `admin_notification_${type}`,
      details: { type, data, sentTo: adminEmails },
    });

    return new Response(
      JSON.stringify({ success: true, sentTo: adminEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
