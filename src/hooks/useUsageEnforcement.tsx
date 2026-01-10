import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsageLimits {
  photo_usage: number;
  video_usage: number;
  audio_usage: number;
  text_usage: number;
  photo_limit: number;
  video_limit: number;
  audio_limit: number;
  text_limit: number;
  properties_used: number;
  properties_limit: number;
  subscription_tier: string;
  subscription_status?: string;
  current_period_start?: string;
  current_period_end?: string;
  subscription_end_date?: string;
}

interface UsageCheck {
  canUse: boolean;
  isAtLimit: boolean;
  isLocked: boolean;
  remaining: number;
  usage: number;
  limit: number;
}

interface BillingCycleInfo {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  daysElapsed: number;
  cycleLength: number;
  isInBillingCycle: boolean;
}

export const useUsageEnforcement = () => {
  const { data: usage, isLoading, refetch } = useQuery({
    queryKey: ['usage-enforcement'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: usageData, error: usageError } = await supabase
        .from('user_usage_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError) throw usageError;

      const { count: propertiesCount, error: propertiesError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (propertiesError) throw propertiesError;

      const tier = usageData.subscription_tier || 'free';
      const propertyLimits = {
        free: 1,
        pro: 5,
        business: 30
      };

      return {
        ...usageData,
        properties_used: propertiesCount || 0,
        properties_limit: propertyLimits[tier as keyof typeof propertyLimits] || 1
      } as UsageLimits;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const checkUsage = (type: 'photo' | 'video' | 'audio' | 'text' | 'property'): UsageCheck => {
    if (!usage) {
      return {
        canUse: false,
        isAtLimit: false,
        isLocked: true,
        remaining: 0,
        usage: 0,
        limit: 0
      };
    }

    let used: number;
    let limit: number;

    if (type === 'property') {
      used = usage.properties_used;
      limit = usage.properties_limit;
    } else {
      used = usage[`${type}_usage`];
      limit = usage[`${type}_limit`];
    }

    const isLocked = limit === 0;
    const isAtLimit = used >= limit;
    const canUse = !isLocked && !isAtLimit;
    const remaining = Math.max(0, limit - used);

    return {
      canUse,
      isAtLimit,
      isLocked,
      remaining,
      usage: used,
      limit
    };
  };

  // Calculate billing cycle information
  const getBillingCycleInfo = (): BillingCycleInfo => {
    if (!usage) {
      return {
        currentPeriodStart: null,
        currentPeriodEnd: null,
        daysRemaining: 0,
        daysElapsed: 0,
        cycleLength: 30,
        isInBillingCycle: false
      };
    }

    const now = new Date();
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;

    // Use subscription dates for paid users, calendar month for free users
    if (usage.subscription_tier !== 'free' && usage.current_period_start && usage.current_period_end) {
      periodStart = new Date(usage.current_period_start);
      periodEnd = new Date(usage.current_period_end);
    } else {
      // Free tier: use calendar month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const cycleLength = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, cycleLength - daysElapsed);
    const isInBillingCycle = now >= periodStart && now <= periodEnd;

    return {
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      daysRemaining,
      daysElapsed,
      cycleLength,
      isInBillingCycle
    };
  };

  // Check if usage should be reset (for display purposes - actual reset happens server-side)
  const shouldResetUsage = (): boolean => {
    if (!usage) return false;
    
    const { currentPeriodEnd } = getBillingCycleInfo();
    if (!currentPeriodEnd) return false;

    const now = new Date();
    return now > currentPeriodEnd;
  };

  return {
    usage,
    isLoading,
    checkUsage,
    refetchUsage: refetch,
    tier: usage?.subscription_tier || 'free',
    getBillingCycleInfo,
    shouldResetUsage,
    subscriptionStatus: usage?.subscription_status,
    isSubscriptionActive: usage?.subscription_status === 'active'
  };
};