// supabase/functions/paystack-verify-transaction/index.ts

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

    console.log("Verifying payment for user:", user.id, "Reference:", reference);

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
      console.error("Paystack verification failed:", data);
      throw new Error(data.message || "Failed to verify transaction");
    }

    console.log("Paystack verification successful");

    const transactionData = data.data;
    const paymentStatus = transactionData.status === "success" ? "success" : "failed";

    console.log("Payment status:", paymentStatus);

    // Check if transaction exists in database
    const { data: existingTransaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .eq("user_id", user.id)
      .single();

    if (!existingTransaction) {
      console.log("Transaction record not found, creating new one...");
      
      // Create new transaction record
      const { error: createError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: transactionData.amount,
          status: paymentStatus,
          plan: transactionData.metadata?.plan || "Unknown",
          reference: reference,
          payment_method: transactionData.channel || "card",
          metadata: transactionData,
        });

      if (createError) {
        console.error("Failed to create transaction:", createError);
      } else {
        console.log("Transaction record created successfully");
      }
    } else {
      console.log("Transaction record found, updating...");
      
      // Update existing transaction record
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: paymentStatus,
          payment_method: transactionData.channel || "card",
          metadata: transactionData,
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update transaction:", updateError);
      } else {
        console.log("Transaction record updated successfully");
      }
    }

    // Update user profile with subscription info if payment successful
    if (paymentStatus === "success") {
      console.log("Payment successful, updating user profile...");
      
      const plan = transactionData.metadata?.plan || "Unknown";
      const subscriptionTier = plan === "Pro" ? "pro" : plan === "Host Business" ? "business" : "free";
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subscription_tier: subscriptionTier,
          subscription_status: "active",
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          paystack_customer_code: transactionData.customer?.customer_code || null,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Failed to update profile:", profileError);
        throw new Error("Payment verified but failed to update subscription");
      }

      console.log(`User ${user.id} subscription updated to ${subscriptionTier}`);
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