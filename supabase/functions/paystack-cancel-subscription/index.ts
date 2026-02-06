// ============================================================
// supabase/functions/paystack-cancel-subscription/index.ts
// Cancels a recurring Paystack subscription via their API
// ============================================================

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

    // Get user's profile with subscription details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("paystack_subscription_code, paystack_email_token, subscription_status, subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.subscription_status !== "active") {
      throw new Error("No active subscription to cancel");
    }

    const previousTier = profile.subscription_tier || 'free';

    // Cancel on Paystack if we have a subscription code
    if (profile.paystack_subscription_code) {
      console.log(`Cancelling Paystack subscription: ${profile.paystack_subscription_code}`);

      // Paystack requires the subscription code and email token to disable
      const disableBody: Record<string, string> = {
        code: profile.paystack_subscription_code,
      };

      // Include email_token if available (required by Paystack)
      if (profile.paystack_email_token) {
        disableBody.token = profile.paystack_email_token;
      }

      const paystackResponse = await fetch("https://api.paystack.co/subscription/disable", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(disableBody),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackResponse.ok) {
        console.error("Paystack cancellation failed:", paystackData);
        // Don't throw — still update our DB so user isn't stuck
        // The webhook or reconciliation will handle the Paystack side
      } else {
        console.log("Paystack subscription disabled successfully:", paystackData);
      }
    }

    // Update user profile to cancel subscription
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        subscription_tier: "free",
        paystack_subscription_code: null,
        paystack_email_token: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Failed to cancel subscription");
    }

    // Log the cancellation event
    await supabase.from("subscription_events").insert({
      user_id: user.id,
      event_type: "subscription.user_cancelled",
      event_data: {
        paystack_subscription_code: profile.paystack_subscription_code,
        cancelled_by: "user",
      },
      previous_status: "active",
      new_status: "cancelled",
      previous_tier: previousTier,
      new_tier: "free",
    });

    console.log(`Subscription cancelled for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription cancelled successfully." 
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
