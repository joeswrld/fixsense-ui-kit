import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";

interface SubscriptionStatus {
  isActive: boolean;
  tier: 'free' | 'pro' | 'business';
  status: string;
  expiresAt: string | null;
  gracePeriodEnd: string | null;
  paymentRequired: boolean;
  daysUntilExpiry: number | null;
  isInGracePeriod: boolean;
}

interface BackendAccessCheck {
  allowed: boolean;
  reason?: string;
  current_tier: string;
  subscription_status: string;
  expires_at?: string;
  upgrade_required?: boolean;
}

export const useSubscriptionAccess = () => {
  const queryClient = useQueryClient();

  // Fetch subscription status from database
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error } = await supabase
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

      if (error) throw error;

      const now = new Date();
      const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
      const gracePeriod = profile.grace_period_end ? new Date(profile.grace_period_end) : null;
      
      // Calculate days until expiry
      let daysUntilExpiry: number | null = null;
      if (endDate) {
        const diff = endDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      // Check if in grace period
      const isInGracePeriod = profile.subscription_status === 'past_due' && 
        gracePeriod && gracePeriod > now;

      // Hard check: if end date passed and no grace period, subscription is expired
      const isExpired = endDate && endDate < now && !isInGracePeriod;
      const effectiveStatus = isExpired ? 'expired' : profile.subscription_status;
      const effectiveTier = isExpired ? 'free' : (profile.subscription_tier || 'free');

      return {
        isActive: effectiveStatus === 'active' || effectiveStatus === 'trialing',
        tier: effectiveTier as 'free' | 'pro' | 'business',
        status: effectiveStatus || 'inactive',
        expiresAt: profile.subscription_end_date,
        gracePeriodEnd: profile.grace_period_end,
        paymentRequired: profile.payment_required || false,
        daysUntilExpiry,
        isInGracePeriod,
      };
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refresh every minute for hard enforcement
    refetchOnWindowFocus: true,
  });

  // Backend access check - the source of truth
  const checkBackendAccess = useCallback(async (requiredTier?: 'pro' | 'business', feature?: string): Promise<BackendAccessCheck> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-access', {
        body: { required_tier: requiredTier, feature },
      });

      if (error) {
        console.error("Backend access check failed:", error);
        // Fail closed - deny access on error
        return {
          allowed: false,
          reason: "Unable to verify subscription",
          current_tier: 'unknown',
          subscription_status: 'error',
        };
      }

      return data as BackendAccessCheck;
    } catch (err) {
      console.error("Backend access check error:", err);
      return {
        allowed: false,
        reason: "Network error verifying subscription",
        current_tier: 'unknown',
        subscription_status: 'error',
      };
    }
  }, []);

  // Real-time subscription updates
  useEffect(() => {
    let channel: any;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Subscription updated:", payload.new);
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  // Helper functions for feature access
  const canAccessFeature = useCallback((requiredTier: 'pro' | 'business'): boolean => {
    if (!subscription) return false;
    
    const tierHierarchy = { free: 0, pro: 1, business: 2 };
    const currentLevel = tierHierarchy[subscription.tier] || 0;
    const requiredLevel = tierHierarchy[requiredTier] || 0;

    // Also check if subscription is actually active
    if (!subscription.isActive && subscription.tier !== 'free') {
      return false;
    }

    return currentLevel >= requiredLevel;
  }, [subscription]);

  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'business';
  const isBusiness = subscription?.tier === 'business';

  return {
    subscription,
    isLoading,
    refetch,
    // Convenience booleans
    isActive: subscription?.isActive || false,
    isPro,
    isBusiness,
    tier: subscription?.tier || 'free',
    status: subscription?.status || 'inactive',
    paymentRequired: subscription?.paymentRequired || false,
    // Feature access helpers
    canAccessFeature,
    checkBackendAccess,
    // Expiry info
    daysUntilExpiry: subscription?.daysUntilExpiry,
    isInGracePeriod: subscription?.isInGracePeriod || false,
    expiresAt: subscription?.expiresAt,
  };
};
