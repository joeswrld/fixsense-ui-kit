
// ============================================================
// supabase/functions/paystack-initialize-transaction/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitializeTransactionRequest {
  email: string;
  amount: number;
  plan: string;
  callback_url: string;
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

    const { email, amount, plan, callback_url } = await req.json() as InitializeTransactionRequest;

    // Generate unique reference
    const reference = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Initializing payment for user:", user.id);
    console.log("Plan:", plan, "Amount:", amount, "Reference:", reference);

    // Initialize transaction with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Amount is already in kobo from frontend
        reference,
        metadata: {
          user_id: user.id,
          plan,
        },
        callback_url,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack initialization failed:", data);
      throw new Error(data.message || "Failed to initialize transaction");
    }

    console.log("Paystack initialization successful");

    // Create transaction record in database
    const { data: transactionData, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount, // Amount in kobo
        status: "pending",
        plan,
        reference,
        payment_method: null,
        metadata: data,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to create transaction record:", dbError);
      // Don't throw error - payment can still proceed
    } else {
      console.log("Transaction record created:", transactionData.id);
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-initialize-transaction:", error);
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