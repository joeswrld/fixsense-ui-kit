import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find users with past_due status who have a saved authorization code
    // and haven't exceeded max retry attempts (3)
    const { data: failedUsers, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "id, email, subscription_tier, paystack_authorization_code, paystack_customer_code, failed_payment_count"
      )
      .in("subscription_status", ["past_due"])
      .not("paystack_authorization_code", "is", null)
      .lt("failed_payment_count", 3);

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    console.log(`Found ${failedUsers?.length || 0} users with failed payments to retry`);

    const results: Array<{ userId: string; success: boolean; message: string }> = [];

    for (const user of failedUsers || []) {
      try {
        // Determine amount based on tier (in kobo)
        const amount = user.subscription_tier === "pro" ? 530000 : 1430000;

        // Charge the user's saved authorization
        const chargeResponse = await fetch(
          "https://api.paystack.co/transaction/charge_authorization",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              authorization_code: user.paystack_authorization_code,
              email: user.email,
              amount,
              metadata: {
                user_id: user.id,
                plan: user.subscription_tier,
                retry: true,
              },
            }),
          }
        );

        const chargeData = await chargeResponse.json();

        if (chargeData.status && chargeData.data?.status === "success") {
          // Payment succeeded - reactivate subscription
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              failed_payment_count: 0,
              last_payment_date: now.toISOString(),
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              grace_period_end: null,
              payment_required: false,
            })
            .eq("id", user.id);

          // Log the successful retry
          await supabase.from("subscription_events").insert({
            user_id: user.id,
            event_type: "payment_retry_success",
            new_status: "active",
            previous_status: "past_due",
            new_tier: user.subscription_tier,
            paystack_reference: chargeData.data?.reference,
          });

          // Record the transaction
          await supabase.from("transactions").insert({
            user_id: user.id,
            reference: chargeData.data?.reference,
            amount,
            plan: user.subscription_tier,
            status: "success",
            payment_method: "card",
            metadata: { retry: true },
          });

          results.push({ userId: user.id, success: true, message: "Payment retried successfully" });
          console.log(`✅ Retry successful for user ${user.id}`);
        } else {
          // Payment failed again - increment counter
          const newCount = (user.failed_payment_count || 0) + 1;
          const updates: Record<string, unknown> = {
            failed_payment_count: newCount,
          };

          // If max retries reached, expire the subscription
          if (newCount >= 3) {
            updates.subscription_status = "expired";
            updates.subscription_tier = "free";
            updates.payment_required = true;

            await supabase.from("subscription_events").insert({
              user_id: user.id,
              event_type: "subscription_expired_max_retries",
              new_status: "expired",
              previous_status: "past_due",
              previous_tier: user.subscription_tier,
              new_tier: "free",
            });
          }

          await supabase.from("profiles").update(updates).eq("id", user.id);

          results.push({
            userId: user.id,
            success: false,
            message: `Retry failed (attempt ${newCount}/3)${newCount >= 3 ? " — subscription expired" : ""}`,
          });
          console.log(`❌ Retry failed for user ${user.id} (attempt ${newCount}/3)`);
        }
      } catch (userError) {
        console.error(`Error retrying payment for user ${user.id}:`, userError);
        results.push({ userId: user.id, success: false, message: String(userError) });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Retry failed payments error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
