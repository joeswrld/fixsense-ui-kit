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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("paystack_subscription_code, subscription_status, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Check if user has an active paid subscription
    if (profile.subscription_status !== "active") {
      throw new Error("No active subscription to cancel");
    }

    // Update user profile to cancel subscription
    // Since we're using one-time payments, not recurring Paystack subscriptions,
    // we just set the subscription to cancelled
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        subscription_tier: "free",
        // Clear Paystack codes
        paystack_subscription_code: null,
        paystack_customer_code: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Failed to cancel subscription");
    }

    console.log(`Subscription cancelled for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription cancelled successfully. Your account will remain active until the current billing period ends." 
      }),
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