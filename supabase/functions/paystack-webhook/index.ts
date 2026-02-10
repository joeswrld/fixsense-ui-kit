// ============================================================
// supabase/functions/paystack-webhook/index.ts
// Handles all Paystack webhook events for subscription lifecycle
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

// Subscription state machine
type SubscriptionState = 'trialing' | 'active' | 'past_due' | 'expired' | 'cancelled' | 'inactive';

interface WebhookPayload {
  event: string;
  data: {
    id?: number;
    domain?: string;
    status?: string;
    reference?: string;
    amount?: number;
    customer?: {
      id?: number;
      email?: string;
      customer_code?: string;
    };
    subscription_code?: string;
    email_token?: string;
    plan?: {
      plan_code?: string;
      name?: string;
      amount?: number;
      interval?: string;
    };
    authorization?: {
      authorization_code?: string;
      card_type?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
      bank?: string;
    };
    metadata?: {
      user_id?: string;
      plan?: string;
    };
    next_payment_date?: string;
    paid_at?: string;
    cancelled_at?: string;
  };
}

// Verify Paystack webhook signature
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return expectedSignature === signature;
}

// Map plan name to subscription tier
function getPlanTier(planName: string | undefined): string {
  if (!planName) return 'free';
  const lower = planName.toLowerCase();
  if (lower.includes('business') || lower.includes('host')) return 'business';
  if (lower.includes('pro')) return 'pro';
  return 'free';
}

// Calculate subscription end date based on plan interval
function calculateEndDate(interval: string = 'monthly'): Date {
  const endDate = new Date();
  switch (interval.toLowerCase()) {
    case 'yearly':
    case 'annually':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
    default:
      endDate.setMonth(endDate.getMonth() + 1);
      break;
  }
  return endDate;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature in production
    if (signature) {
      const isValid = await verifySignature(rawBody, signature, paystackSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log(`Received Paystack webhook: ${event}`);
    console.log("Webhook data:", JSON.stringify(data, null, 2));

    // Get user_id from metadata or customer email
    let userId = data.metadata?.user_id;
    
    if (!userId && data.customer?.email) {
      // Look up user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.customer.email)
        .single();
      
      userId = profile?.id;
    }

    if (!userId && data.customer?.customer_code) {
      // Look up by Paystack customer code
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("paystack_customer_code", data.customer.customer_code)
        .single();
      
      userId = profile?.id;
    }

    if (!userId) {
      console.error("Could not identify user for webhook event");
      // Return 200 to acknowledge receipt (don't retry)
      return new Response(JSON.stringify({ received: true, warning: "User not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get current profile state for audit
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_tier")
      .eq("id", userId)
      .single();

    const previousStatus = currentProfile?.subscription_status || 'inactive';
    const previousTier = currentProfile?.subscription_tier || 'free';

    let newStatus: SubscriptionState = previousStatus as SubscriptionState;
    let newTier = previousTier;
    let updateData: Record<string, any> = {
      last_webhook_event: event,
      last_webhook_at: new Date().toISOString(),
    };

    // Handle different webhook events
    switch (event) {
      // ===== SUBSCRIPTION CREATED =====
      case "subscription.create":
        newStatus = 'active';
        newTier = getPlanTier(data.plan?.name || data.metadata?.plan);
        updateData = {
          ...updateData,
          subscription_status: newStatus,
          subscription_tier: newTier,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: data.next_payment_date || calculateEndDate(data.plan?.interval).toISOString(),
          paystack_subscription_code: data.subscription_code,
          paystack_customer_code: data.customer?.customer_code,
          paystack_plan_code: data.plan?.plan_code,
          paystack_email_token: data.email_token,
          paystack_authorization_code: data.authorization?.authorization_code,
          failed_payment_count: 0,
          payment_required: false,
          grace_period_end: null,
        };
        console.log(`Subscription created for user ${userId}: ${newTier}`);
        break;

      // ===== SUCCESSFUL CHARGE (Recurring payment success) =====
      case "charge.success":
        // Only process if it's a subscription charge (has subscription_code or plan in metadata)
        if (data.subscription_code || data.metadata?.plan) {
          newStatus = 'active';
          newTier = getPlanTier(data.plan?.name || data.metadata?.plan);
          const endDate = calculateEndDate(data.plan?.interval || 'monthly');
          
          updateData = {
            ...updateData,
            subscription_status: newStatus,
            subscription_tier: newTier,
            subscription_end_date: endDate.toISOString(),
            last_payment_date: data.paid_at || new Date().toISOString(),
            failed_payment_count: 0,
            payment_required: false,
            grace_period_end: null,
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
          };
          
          // Reset monthly usage on successful renewal
          await supabase.rpc('reset_paid_user_usage', { p_user_id: userId });
          
          console.log(`Payment successful for user ${userId}, renewed until ${endDate.toISOString()}`);
        }
        break;

      // ===== INVOICE PAYMENT FAILED =====
      case "invoice.payment_failed":
        const failedCount = (currentProfile as any)?.failed_payment_count || 0;
        const newFailedCount = failedCount + 1;
        
        // First failure: set to past_due with 3-day grace period
        // Second failure: extend grace period
        // Third+ failure: set to expired
        if (newFailedCount >= 3) {
          newStatus = 'expired';
          updateData = {
            ...updateData,
            subscription_status: newStatus,
            subscription_tier: 'free', // Downgrade to free
            failed_payment_count: newFailedCount,
            payment_required: true,
          };
          newTier = 'free';
          console.log(`User ${userId} expired after ${newFailedCount} failed payments`);
        } else {
          newStatus = 'past_due';
          const gracePeriod = new Date();
          gracePeriod.setDate(gracePeriod.getDate() + 3); // 3-day grace period
          
          updateData = {
            ...updateData,
            subscription_status: newStatus,
            failed_payment_count: newFailedCount,
            payment_required: true,
            grace_period_end: gracePeriod.toISOString(),
          };
          console.log(`Payment failed for user ${userId}, attempt ${newFailedCount}/3`);
        }
        break;

      // ===== SUBSCRIPTION DISABLED =====
      case "subscription.disable":
        newStatus = 'cancelled';
        newTier = 'free';
        updateData = {
          ...updateData,
          subscription_status: newStatus,
          subscription_tier: newTier,
          paystack_subscription_code: null,
          paystack_email_token: null,
        };
        console.log(`Subscription disabled for user ${userId}`);
        break;

      // ===== SUBSCRIPTION NOT RENEWED =====
      case "subscription.not_renew":
        newStatus = 'expired';
        newTier = 'free';
        updateData = {
          ...updateData,
          subscription_status: newStatus,
          subscription_tier: newTier,
          payment_required: true,
        };
        console.log(`Subscription not renewed for user ${userId}`);
        break;

      // ===== SUBSCRIPTION EXPIRING SOON (optional: send reminder) =====
      case "subscription.expiring_cards":
        console.log(`Card expiring soon for user ${userId}`);
        // Could trigger an email notification here
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      throw updateError;
    }

    // Log subscription event for audit trail
    await supabase.from("subscription_events").insert({
      user_id: userId,
      event_type: event,
      event_data: data,
      paystack_reference: data.reference,
      previous_status: previousStatus,
      new_status: newStatus,
      previous_tier: previousTier,
      new_tier: newTier,
    });

    console.log(`Successfully processed ${event} for user ${userId}`);

    return new Response(
      JSON.stringify({ received: true, processed: event }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    
    // Return 500 so Paystack retries
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
