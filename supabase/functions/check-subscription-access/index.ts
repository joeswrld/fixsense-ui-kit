// ============================================================
// supabase/functions/check-subscription-access/index.ts
// Backend enforcement - verify subscription before allowing access
// Call this from ANY protected endpoint or feature check
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessCheckRequest {
  required_tier?: 'pro' | 'business'; // Minimum tier required
  feature?: string; // Optional feature name for logging
}

interface AccessCheckResponse {
  allowed: boolean;
  reason?: string;
  current_tier: string;
  subscription_status: string;
  expires_at?: string;
  upgrade_required?: boolean;
}

const TIER_HIERARCHY = {
  'free': 0,
  'pro': 1,
  'business': 2,
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Not authenticated",
          current_tier: 'none',
          subscription_status: 'none',
        } as AccessCheckResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Invalid authentication",
          current_tier: 'none',
          subscription_status: 'none',
        } as AccessCheckResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get request body
    let requiredTier: 'pro' | 'business' | undefined;
    let feature: string | undefined;

    try {
      const body = await req.json() as AccessCheckRequest;
      requiredTier = body.required_tier;
      feature = body.feature;
    } catch {
      // No body is fine - just checking general access
    }

    // Get user's subscription info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        subscription_status,
        subscription_tier,
        subscription_end_date,
        grace_period_end,
        payment_required,
        user_type
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Profile not found",
          current_tier: 'free',
          subscription_status: 'inactive',
        } as AccessCheckResponse),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const currentTier = profile.subscription_tier || 'free';
    const status = profile.subscription_status || 'inactive';
    const endDate = profile.subscription_end_date;
    const gracePeriodEnd = profile.grace_period_end;

    // === HARD ENFORCEMENT CHECKS ===

    // 1. Check if subscription has ended (time-based check)
    if (endDate && currentTier !== 'free') {
      const endDateTime = new Date(endDate);
      const now = new Date();

      if (endDateTime < now) {
        // Check grace period
        if (gracePeriodEnd) {
          const graceEnd = new Date(gracePeriodEnd);
          if (graceEnd < now) {
            // Grace period also expired
            console.log(`Access denied for user ${user.id}: subscription and grace period expired`);
            
            // Auto-expire the user
            await supabase
              .from("profiles")
              .update({
                subscription_status: 'expired',
                subscription_tier: 'free',
                payment_required: true,
              })
              .eq("id", user.id);

            return new Response(
              JSON.stringify({
                allowed: false,
                reason: "Subscription expired. Please renew to continue.",
                current_tier: 'free',
                subscription_status: 'expired',
                upgrade_required: true,
              } as AccessCheckResponse),
              {
                status: 403,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            );
          }
        } else {
          // No grace period, immediate expiration
          console.log(`Access denied for user ${user.id}: subscription expired, no grace period`);
          
          await supabase
            .from("profiles")
            .update({
              subscription_status: 'expired',
              subscription_tier: 'free',
              payment_required: true,
            })
            .eq("id", user.id);

          return new Response(
            JSON.stringify({
              allowed: false,
              reason: "Subscription expired. Please renew to continue.",
              current_tier: 'free',
              subscription_status: 'expired',
              upgrade_required: true,
            } as AccessCheckResponse),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      }
    }

    // 2. Check subscription status
    if (status === 'expired' || status === 'cancelled') {
      return new Response(
        JSON.stringify({
          allowed: currentTier === 'free' || !requiredTier,
          reason: status === 'expired' ? "Subscription expired" : "Subscription cancelled",
          current_tier: 'free',
          subscription_status: status,
          upgrade_required: !!requiredTier,
        } as AccessCheckResponse),
        {
          status: requiredTier ? 403 : 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 3. Check payment required flag
    if (profile.payment_required && currentTier !== 'free') {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Payment required to continue",
          current_tier: currentTier,
          subscription_status: 'past_due',
          expires_at: endDate,
          upgrade_required: true,
        } as AccessCheckResponse),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 4. Check tier hierarchy if specific tier is required
    if (requiredTier) {
      const requiredLevel = TIER_HIERARCHY[requiredTier] || 0;
      const currentLevel = TIER_HIERARCHY[currentTier as keyof typeof TIER_HIERARCHY] || 0;

      if (currentLevel < requiredLevel) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: `This feature requires ${requiredTier} plan or higher`,
            current_tier: currentTier,
            subscription_status: status,
            expires_at: endDate,
            upgrade_required: true,
          } as AccessCheckResponse),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // 5. Check if active or in valid state
    const validStates = ['active', 'trialing', 'past_due'];
    if (!validStates.includes(status) && currentTier !== 'free') {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Invalid subscription state",
          current_tier: currentTier,
          subscription_status: status,
          upgrade_required: true,
        } as AccessCheckResponse),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // === ACCESS GRANTED ===
    console.log(`Access granted for user ${user.id}, tier: ${currentTier}, feature: ${feature || 'general'}`);

    return new Response(
      JSON.stringify({
        allowed: true,
        current_tier: currentTier,
        subscription_status: status,
        expires_at: endDate,
      } as AccessCheckResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error checking subscription access:", error);
    
    // Fail closed - deny access on error
    return new Response(
      JSON.stringify({
        allowed: false,
        reason: "Error verifying subscription",
        current_tier: 'unknown',
        subscription_status: 'error',
      } as AccessCheckResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
