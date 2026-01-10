// ============================================================
// supabase/functions/paystack-create-subscription/index.ts
// Creates a RECURRING subscription, not a one-time payment
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  email: string;
  plan: string; // 'pro' or 'business'
  callback_url: string;
}

// Plan codes - these MUST be set as Supabase secrets
// Create plans in Paystack dashboard first, then add the plan codes as secrets
const getPlanConfig = (plan: string): { code: string; name: string; amount: number } | null => {
  const proPlanCode = Deno.env.get("PAYSTACK_PRO_PLAN_CODE");
  const businessPlanCode = Deno.env.get("PAYSTACK_BUSINESS_PLAN_CODE");
  
  const configs: Record<string, { code: string | undefined; name: string; amount: number }> = {
    pro: {
      code: proPlanCode,
      name: "Pro",
      amount: 530000, // ₦5,300 in kobo
    },
    business: {
      code: businessPlanCode,
      name: "Host Business",
      amount: 1430000, // ₦14,300 in kobo
    },
  };
  
  const config = configs[plan.toLowerCase()];
  if (!config || !config.code) {
    return null;
  }
  
  return { code: config.code, name: config.name, amount: config.amount };
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, plan, callback_url } = await req.json() as CreateSubscriptionRequest;

    // Validate plan and get config
    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      const proPlanCode = Deno.env.get("PAYSTACK_PRO_PLAN_CODE");
      const businessPlanCode = Deno.env.get("PAYSTACK_BUSINESS_PLAN_CODE");
      
      if (plan.toLowerCase() === 'pro' && !proPlanCode) {
        throw new Error("PAYSTACK_PRO_PLAN_CODE secret is not configured. Please add your Paystack Pro plan code in Supabase secrets.");
      }
      if (plan.toLowerCase() === 'business' && !businessPlanCode) {
        throw new Error("PAYSTACK_BUSINESS_PLAN_CODE secret is not configured. Please add your Paystack Business plan code in Supabase secrets.");
      }
      throw new Error(`Invalid plan: ${plan}. Must be 'pro' or 'business'`);
    }

    console.log(`Creating subscription for user ${user.id}, plan: ${plan}`);

    // Check if user already has an active subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("paystack_subscription_code, subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_status === 'active' && profile?.paystack_subscription_code) {
      throw new Error("User already has an active subscription. Cancel existing subscription first.");
    }

    // Step 1: Create or get customer
    let customerCode: string | null = null;
    
    // Check if customer exists
    const customerLookup = await fetch(
      `https://api.paystack.co/customer/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
        },
      }
    );

    if (customerLookup.ok) {
      const customerData = await customerLookup.json();
      customerCode = customerData.data?.customer_code;
      console.log("Found existing customer:", customerCode);
    }

    if (!customerCode) {
      // Create new customer
      const createCustomer = await fetch("https://api.paystack.co/customer", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          metadata: {
            user_id: user.id,
          },
        }),
      });

      const customerResult = await createCustomer.json();
      if (!createCustomer.ok) {
        console.error("Failed to create customer:", customerResult);
        throw new Error("Failed to create Paystack customer");
      }
      customerCode = customerResult.data.customer_code;
      console.log("Created new customer:", customerCode);
    }

    // Update profile with customer code
    await supabase
      .from("profiles")
      .update({ paystack_customer_code: customerCode })
      .eq("id", user.id);

    // Step 2: Initialize transaction for subscription
    // Using transaction/initialize with plan parameter creates a subscription
    const reference = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const initResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: planConfig.amount,
        reference,
        callback_url,
        plan: planConfig.code, // THIS IS THE KEY - specifying plan makes it recurring!
        metadata: {
          user_id: user.id,
          plan: planConfig.name,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            },
            {
              display_name: "Plan",
              variable_name: "plan",
              value: planConfig.name,
            },
          ],
        },
      }),
    });

    const initData = await initResponse.json();

    if (!initResponse.ok) {
      console.error("Paystack initialization failed:", initData);
      throw new Error(initData.message || "Failed to initialize subscription");
    }

    console.log("Subscription initialization successful:", initData.data.reference);

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: planConfig.amount,
      status: "pending",
      plan: planConfig.name,
      reference,
      metadata: {
        type: "subscription",
        plan_code: planConfig.code,
        authorization_url: initData.data.authorization_url,
      },
    });

    // Log subscription event
    await supabase.from("subscription_events").insert({
      user_id: user.id,
      event_type: "subscription.initiated",
      event_data: { plan: planConfig.name, reference },
      paystack_reference: reference,
      previous_status: profile?.subscription_status || 'inactive',
      new_status: 'pending',
      previous_tier: 'free',
      new_tier: plan.toLowerCase(),
    });

    return new Response(
      JSON.stringify({
        status: true,
        message: "Subscription initialized",
        data: {
          authorization_url: initData.data.authorization_url,
          access_code: initData.data.access_code,
          reference: initData.data.reference,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-create-subscription:", error);
    return new Response(
      JSON.stringify({ status: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
