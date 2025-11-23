import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTransactionRequest {
  reference: string;
}

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

    const { reference } = await req.json() as VerifyTransactionRequest;

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to verify transaction");
    }

    console.log("Transaction verified:", data);

    // Update user profile with subscription info
    if (data.data.status === "success") {
      const plan = data.data.metadata.plan;
      const subscriptionTier = plan === "Pro" ? "pro" : plan === "Host Business" ? "business" : "free";
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      await supabase
        .from("profiles")
        .update({
          subscription_tier: subscriptionTier,
          subscription_status: "active",
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          paystack_customer_code: data.data.customer.customer_code,
        })
        .eq("id", user.id);

      console.log(`Updated user ${user.id} subscription to ${subscriptionTier}`);
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-verify-transaction:", error);
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
