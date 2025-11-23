import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's subscription code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("paystack_subscription_code, subscription_status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (!profile.paystack_subscription_code) {
      throw new Error("No active subscription found");
    }

    // Cancel subscription with Paystack
    const response = await fetch(
      `https://api.paystack.co/subscription/disable`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: profile.paystack_subscription_code,
          token: profile.paystack_subscription_code,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel subscription");
    }

    console.log("Subscription cancelled:", data);

    // Update user profile
    await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        subscription_tier: "free",
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Subscription cancelled successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-cancel-subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
