import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Video, 
  Mic, 
  FileText, 
  Building2, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  CreditCard
} from 'lucide-react';

interface UsageData {
  photo_usage: number;
  video_usage: number;
  audio_usage: number;
  text_usage: number;
  photo_limit: number;
  video_limit: number;
  audio_limit: number;
  text_limit: number;
  subscription_tier: string;
  current_period_start: string;
  current_period_end: string;
  properties_used?: number;
  properties_limit?: number;
}

interface UsageMetric {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number;
  color: string;
}

interface UsageSectionProps {
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
}

const UsageSection: React.FC<UsageSectionProps> = ({ onUpgrade, onBuyCredits }) => {
  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['user-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch usage data
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError) throw usageError;

      // Fetch property count
      const { count: propertiesCount, error: propertiesError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (propertiesError) throw propertiesError;

      // Calculate property limit based on tier
      const tier = usageData.subscription_tier || 'free';
      const propertyLimits = {
        free: 1,
        pro: 10,
        business: 50
      };

      return {
        ...usageData,
        properties_used: propertiesCount || 0,
        properties_limit: propertyLimits[tier as keyof typeof propertyLimits] || 1
      } as UsageData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getPercentage = (used: number, limit: number): number => {
    if (limit === 0) return 100;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getTextColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-foreground';
  };

  const formatResetDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load usage data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const diagnostics: UsageMetric[] = [
    {
      label: 'Photo Diagnostics',
      icon: Camera,
      used: usage.photo_usage,
      limit: usage.photo_limit,
      color: 'text-blue-600'
    },
    {
      label: 'Audio Diagnostics',
      icon: Mic,
      used: usage.audio_usage,
      limit: usage.audio_limit,
      color: 'text-purple-600'
    },
    {
      label: 'Video Diagnostics',
      icon: Video,
      used: usage.video_usage,
      limit: usage.video_limit,
      color: 'text-green-600'
    },
    {
      label: 'Text Diagnostics',
      icon: FileText,
      used: usage.text_usage,
      limit: usage.text_limit,
      color: 'text-orange-600'
    }
  ];

  const highestUsagePercentage = Math.max(
    getPercentage(usage.photo_usage, usage.photo_limit),
    getPercentage(usage.audio_usage, usage.audio_limit),
    getPercentage(usage.video_usage, usage.video_limit),
    getPercentage(usage.text_usage, usage.text_limit)
  );

  const propertiesPercentage = usage.properties_used && usage.properties_limit 
    ? getPercentage(usage.properties_used, usage.properties_limit)
    : 0;

  const showWarning = highestUsagePercentage >= 75 || propertiesPercentage >= 75;
  const atLimit = highestUsagePercentage >= 90 || propertiesPercentage >= 90;

  const tier = usage.subscription_tier || 'free';

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {showWarning && (
        <Alert className={atLimit ? 'border-destructive bg-destructive/10' : 'border-yellow-500 bg-yellow-50'}>
          <AlertTriangle className={`h-4 w-4 ${atLimit ? 'text-destructive' : 'text-yellow-600'}`} />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              {atLimit ? (
                <span className="text-destructive font-medium">
                  You've reached 90% of your usage limit. Upgrade your plan or purchase credits to continue.
                </span>
              ) : (
                <span className="text-yellow-800">
                  You're at {highestUsagePercentage}% of your quota — consider upgrading for more capacity.
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {tier === 'free' && onUpgrade && (
                <Button size="sm" onClick={onUpgrade}>
                  Upgrade Plan
                </Button>
              )}
              {onBuyCredits && (
                <Button size="sm" variant="outline" onClick={onBuyCredits}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buy Credits
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Reset Date Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Quota resets on: <strong>{formatResetDate(usage.current_period_end)}</strong></span>
        </div>
        <Badge variant="outline" className="capitalize">
          {tier} Plan
        </Badge>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Diagnostics Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Diagnostics Usage
            </CardTitle>
            <CardDescription>
              Track your monthly diagnostic quotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {diagnostics.map((diagnostic) => {
              const Icon = diagnostic.icon;
              const percentage = getPercentage(diagnostic.used, diagnostic.limit);
              const isDisabled = diagnostic.limit === 0;

              return (
                <div key={diagnostic.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isDisabled ? 'text-muted-foreground' : diagnostic.color}`} />
                      <span className="font-medium">{diagnostic.label}</span>
                    </div>
                    <span 
                      className={`font-semibold ${isDisabled ? 'text-muted-foreground' : getTextColor(percentage)}`}
                      aria-label={`${diagnostic.used} of ${diagnostic.limit} ${diagnostic.label} used`}
                    >
                      {isDisabled ? (
                        'Not available'
                      ) : (
                        <>
                          {diagnostic.used.toLocaleString()} / {diagnostic.limit.toLocaleString()}
                        </>
                      )}
                    </span>
                  </div>
                  {!isDisabled && (
                    <div className="relative">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        aria-label={`Progress: ${percentage}% used`}
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  )}
                  {isDisabled && (
                    <div className="text-xs text-muted-foreground italic">
                      Upgrade to unlock this diagnostic type
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Property Usage Card */}
        {usage.properties_used !== undefined && usage.properties_limit !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Property Management
              </CardTitle>
              <CardDescription>
                Track your property capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Properties Managed</span>
                  </div>
                  <span 
                    className={`font-semibold ${getTextColor(propertiesPercentage)}`}
                    aria-label={`${usage.properties_used} of ${usage.properties_limit} properties managed`}
                  >
                    {usage.properties_used} / {usage.properties_limit}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={propertiesPercentage} 
                    className="h-2"
                    aria-label={`Progress: ${propertiesPercentage}% of property limit used`}
                  />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(propertiesPercentage)}`}
                    style={{ width: `${propertiesPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={propertiesPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">Your Plan Includes:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Up to {usage.properties_limit} {usage.properties_limit === 1 ? 'property' : 'properties'}</li>
                      <li>• Unlimited appliances per property</li>
                      <li>• Full maintenance tracking</li>
                      {tier !== 'free' && (
                        <>
                          <li>• Vendor management</li>
                          <li>• Warranty tracking</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Property Limits by Plan */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Property Limits by Plan:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`p-2 rounded-lg border ${tier === 'free' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Free</p>
                      <p className="text-center text-muted-foreground mt-1">1 property</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${tier === 'pro' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Pro</p>
                      <p className="text-center text-muted-foreground mt-1">10 properties</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${tier === 'business' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Business</p>
                      <p className="text-center text-muted-foreground mt-1">50 properties</p>
                    </div>
                  </div>
                </div>

                {propertiesPercentage >= 75 && tier === 'free' && (
                  <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <p className="font-medium text-primary mb-1">Need more properties?</p>
                    <p>Upgrade to Pro for 10 properties or Business for 50 properties.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      {tier === 'free' && onUpgrade && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-lg mb-1">Need More Capacity?</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro or Business for higher limits and advanced features
                </p>
              </div>
              <Button size="lg" onClick={onUpgrade} className="flex-shrink-0">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsageSection;