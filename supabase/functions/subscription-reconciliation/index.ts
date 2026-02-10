// ============================================================
// supabase/functions/subscription-reconciliation/index.ts
// Daily job to reconcile Paystack subscriptions with database
// Run via cron job: 0 2 * * * (2 AM daily)
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaystackSubscription {
  id: number;
  subscription_code: string;
  email_token: string;
  status: string;
  amount: number;
  next_payment_date: string;
  customer: {
    email: string;
    customer_code: string;
  };
  plan: {
    plan_code: string;
    name: string;
    interval: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results = {
    checked: 0,
    fixed: 0,
    expired: 0,
    errors: [] as string[],
  };

  try {
    console.log("Starting subscription reconciliation...");

    // 1. Get all users with paid subscription status
    const { data: paidUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, subscription_status, subscription_tier, subscription_end_date, paystack_subscription_code, paystack_customer_code")
      .in("subscription_tier", ["pro", "business"])
      .not("subscription_status", "eq", "cancelled");

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${paidUsers?.length || 0} paid users to check`);

    // 2. Check each user against Paystack
    for (const user of paidUsers || []) {
      results.checked++;

      try {
        // Check if subscription end date has passed
        if (user.subscription_end_date) {
          const endDate = new Date(user.subscription_end_date);
          const now = new Date();

          if (endDate < now && user.subscription_status === 'active') {
            console.log(`User ${user.id} subscription expired (end date: ${endDate.toISOString()})`);
            
            // Verify with Paystack before marking expired
            if (user.paystack_subscription_code) {
              const subResponse = await fetch(
                `https://api.paystack.co/subscription/${user.paystack_subscription_code}`,
                {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${paystackSecretKey}`,
                  },
                }
              );

              if (subResponse.ok) {
                const subData = await subResponse.json();
                const paystackStatus = subData.data?.status;
                
                if (paystackStatus === 'active') {
                  // Paystack says active - update our end date
                  const nextPayment = subData.data?.next_payment_date;
                  if (nextPayment) {
                    await supabase
                      .from("profiles")
                      .update({
                        subscription_end_date: nextPayment,
                        last_reconciled_at: new Date().toISOString(),
                      })
                      .eq("id", user.id);
                    
                    console.log(`Fixed user ${user.id} - updated end date to ${nextPayment}`);
                    results.fixed++;
                    continue;
                  }
                }
              }
            }

            // Paystack confirms not active - expire the user
            await supabase
              .from("profiles")
              .update({
                subscription_status: 'expired',
                subscription_tier: 'free',
                payment_required: true,
                last_reconciled_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            await supabase.from("subscription_events").insert({
              user_id: user.id,
              event_type: "reconciliation.expired",
              event_data: { reason: "end_date_passed", end_date: user.subscription_end_date },
              previous_status: user.subscription_status,
              new_status: 'expired',
              previous_tier: user.subscription_tier,
              new_tier: 'free',
            });

            results.expired++;
            console.log(`Expired user ${user.id}`);
          }
        }

        // 3. Verify subscription status with Paystack
        if (user.paystack_subscription_code && user.subscription_status === 'active') {
          const subResponse = await fetch(
            `https://api.paystack.co/subscription/${user.paystack_subscription_code}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${paystackSecretKey}`,
              },
            }
          );

          if (subResponse.ok) {
            const subData = await subResponse.json();
            const paystackStatus = subData.data?.status;

            // Map Paystack status to our status
            if (paystackStatus === 'cancelled' || paystackStatus === 'non-renewing') {
              await supabase
                .from("profiles")
                .update({
                  subscription_status: 'cancelled',
                  subscription_tier: 'free',
                  last_reconciled_at: new Date().toISOString(),
                })
                .eq("id", user.id);

              await supabase.from("subscription_events").insert({
                user_id: user.id,
                event_type: "reconciliation.cancelled",
                event_data: { paystack_status: paystackStatus },
                previous_status: user.subscription_status,
                new_status: 'cancelled',
                previous_tier: user.subscription_tier,
                new_tier: 'free',
              });

              results.fixed++;
              console.log(`User ${user.id} marked as cancelled (Paystack status: ${paystackStatus})`);
            } else if (paystackStatus === 'active' && subData.data?.next_payment_date) {
              // Sync next payment date
              await supabase
                .from("profiles")
                .update({
                  subscription_end_date: subData.data.next_payment_date,
                  last_reconciled_at: new Date().toISOString(),
                })
                .eq("id", user.id);
            }
          } else if (subResponse.status === 404) {
            // Subscription not found in Paystack
            console.log(`Subscription ${user.paystack_subscription_code} not found in Paystack`);
            
            await supabase
              .from("profiles")
              .update({
                subscription_status: 'expired',
                subscription_tier: 'free',
                paystack_subscription_code: null,
                payment_required: true,
                last_reconciled_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            await supabase.from("subscription_events").insert({
              user_id: user.id,
              event_type: "reconciliation.not_found",
              event_data: { subscription_code: user.paystack_subscription_code },
              previous_status: user.subscription_status,
              new_status: 'expired',
              previous_tier: user.subscription_tier,
              new_tier: 'free',
            });

            results.expired++;
          }
        }

        // Update last reconciled timestamp
        await supabase
          .from("profiles")
          .update({ last_reconciled_at: new Date().toISOString() })
          .eq("id", user.id);

      } catch (userError: any) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.errors.push(`User ${user.id}: ${userError.message}`);
      }
    }

    // 4. Check for grace period expirations
    const { data: pastDueUsers } = await supabase
      .from("profiles")
      .select("id, grace_period_end, subscription_tier")
      .eq("subscription_status", "past_due")
      .lt("grace_period_end", new Date().toISOString());

    for (const user of pastDueUsers || []) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: 'expired',
          subscription_tier: 'free',
          payment_required: true,
          last_reconciled_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      await supabase.from("subscription_events").insert({
        user_id: user.id,
        event_type: "reconciliation.grace_period_expired",
        event_data: { grace_period_end: user.grace_period_end },
        previous_status: 'past_due',
        new_status: 'expired',
        previous_tier: user.subscription_tier,
        new_tier: 'free',
      });

      results.expired++;
      console.log(`Grace period expired for user ${user.id}`);
    }

    console.log("Reconciliation complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, results }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
