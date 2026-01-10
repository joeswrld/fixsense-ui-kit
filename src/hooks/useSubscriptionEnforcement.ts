import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionState {
  tier: 'free' | 'pro' | 'business';
  status: string;
  isActive: boolean;
  isExpired: boolean;
  isPastDue: boolean;
  isInGracePeriod: boolean;
  daysUntilExpiry: number | null;
  gracePeriodDaysRemaining: number | null;
  subscriptionEndDate: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentRequired: boolean;
  needsRenewal: boolean;
}

export const useSubscriptionEnforcement = () => {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription-enforcement'],
    queryFn: async (): Promise<SubscriptionState> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          subscription_tier,
          subscription_status,
          subscription_end_date,
          subscription_start_date,
          current_period_start,
          current_period_end,
          grace_period_end,
          payment_required,
          failed_payment_count
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const now = new Date();
      const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
      const gracePeriodEnd = profile.grace_period_end ? new Date(profile.grace_period_end) : null;
      
      // Calculate days until expiry
      let daysUntilExpiry: number | null = null;
      if (endDate) {
        const diffTime = endDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate grace period days remaining
      let gracePeriodDaysRemaining: number | null = null;
      if (gracePeriodEnd && profile.subscription_status === 'past_due') {
        const diffTime = gracePeriodEnd.getTime() - now.getTime();
        gracePeriodDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const tier = (profile.subscription_tier || 'free') as 'free' | 'pro' | 'business';
      const status = profile.subscription_status || 'inactive';
      
      // Determine subscription state
      const isActive = status === 'active' && tier !== 'free';
      const isExpired = status === 'expired' || (endDate && endDate < now && status !== 'active');
      const isPastDue = status === 'past_due';
      const isInGracePeriod = isPastDue && gracePeriodEnd && gracePeriodEnd > now;
      const needsRenewal = (daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0) || 
                          profile.payment_required === true;

      return {
        tier,
        status,
        isActive,
        isExpired,
        isPastDue,
        isInGracePeriod: !!isInGracePeriod,
        daysUntilExpiry,
        gracePeriodDaysRemaining,
        subscriptionEndDate: profile.subscription_end_date,
        currentPeriodStart: profile.current_period_start,
        currentPeriodEnd: profile.current_period_end,
        paymentRequired: profile.payment_required || false,
        needsRenewal,
      };
    },
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });

  // Real-time subscription updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('subscription-enforcement')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Subscription status updated:', payload.new);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['usage-enforcement'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [refetch, queryClient]);

  // Check and enforce subscription on load
  const enforceSubscription = useCallback(async () => {
    if (!subscription) return;

    // Show warning for expiring subscriptions
    if (subscription.needsRenewal && !subscription.isExpired) {
      if (subscription.daysUntilExpiry !== null && subscription.daysUntilExpiry <= 3) {
        toast.warning(
          `Your subscription expires in ${subscription.daysUntilExpiry} day${subscription.daysUntilExpiry === 1 ? '' : 's'}. Renew now to avoid service interruption.`,
          { duration: 10000 }
        );
      }
    }

    // Show past due warning
    if (subscription.isPastDue && subscription.isInGracePeriod) {
      toast.error(
        `Payment failed. You have ${subscription.gracePeriodDaysRemaining} day${subscription.gracePeriodDaysRemaining === 1 ? '' : 's'} remaining in your grace period.`,
        { duration: 10000 }
      );
    }

    // Handle expired subscription - call backend to ensure downgrade
    if (subscription.isExpired && subscription.tier !== 'free') {
      try {
        await supabase.functions.invoke('check-subscription-access', {
          body: { required_tier: subscription.tier },
        });
        refetch();
      } catch (error) {
        console.error('Error checking subscription access:', error);
      }
    }
  }, [subscription, refetch]);

  useEffect(() => {
    enforceSubscription();
  }, [enforceSubscription]);

  // Check if user can access a feature based on tier
  const canAccessFeature = useCallback((requiredTier: 'free' | 'pro' | 'business'): boolean => {
    if (!subscription) return false;
    
    const tierHierarchy = { free: 0, pro: 1, business: 2 };
    const userTierLevel = tierHierarchy[subscription.tier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier] || 0;

    return userTierLevel >= requiredTierLevel && !subscription.isExpired;
  }, [subscription]);

  // Get days until billing cycle reset
  const getDaysUntilReset = useCallback((): number | null => {
    if (!subscription?.currentPeriodEnd) return null;
    
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  return {
    subscription,
    isLoading,
    refetch,
    canAccessFeature,
    getDaysUntilReset,
    isDowngraded: subscription?.isExpired || subscription?.tier === 'free',
    needsPayment: subscription?.paymentRequired || subscription?.isPastDue,
  };
};
