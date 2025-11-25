import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Camera, 
  Video, 
  Mic, 
  FileText, 
  Building2, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  CreditCard,
  Crown,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useUsageEnforcement } from '@/hooks/useUsageEnforcement';

interface UsageMetric {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'photo' | 'video' | 'audio' | 'text';
  color: string;
}

interface UsageSectionProps {
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
}

const plans = [
  {
    name: "Pro",
    price: 530000,
    tier: "pro",
    features: [
      "30 photo diagnostics per month",
      "10 audio diagnostics per month",
      "2 video diagnostics per month",
      "40 text diagnostics per month",
      "5 properties",
      "Full history",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Host Business",
    price: 880000,
    tier: "business",
    features: [
      "60 photo diagnostics per month",
      "20 audio diagnostics per month",
      "5 video diagnostics per month",
      "150 text diagnostics per month",
      "30 properties",
      "Advanced analytics",
      "Dedicated support",
    ],
  },
];

const UsageSection: React.FC<UsageSectionProps> = ({ onUpgrade, onBuyCredits }) => {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  
  const { usage, isLoading, checkUsage, tier, refetchUsage } = useUsageEnforcement();

  const initializePayment = async (plan: typeof plans[0]) => {
    try {
      setProcessingPlan(plan.tier);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("paystack-initialize-transaction", {
        body: {
          email: profile?.email || user.email,
          amount: plan.price,
          plan: plan.name,
          callback_url: window.location.origin + "/settings?tab=billing",
        },
      });

      if (error) throw error;

      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
    } catch (error: any) {
      toast.error("Failed to initialize payment");
      console.error(error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setUpgradeDialogOpen(true);
    }
  };

  const getPercentage = (used: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTextColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
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

  if (isLoading || !usage) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  const diagnostics: UsageMetric[] = [
    {
      label: 'Photo Diagnostics',
      icon: Camera,
      type: 'photo',
      color: 'text-blue-600'
    },
    {
      label: 'Audio Diagnostics',
      icon: Mic,
      type: 'audio',
      color: 'text-purple-600'
    },
    {
      label: 'Video Diagnostics',
      icon: Video,
      type: 'video',
      color: 'text-green-600'
    },
    {
      label: 'Text Diagnostics',
      icon: FileText,
      type: 'text',
      color: 'text-orange-600'
    }
  ];

  const diagnosticChecks = diagnostics.map(d => ({
    ...d,
    check: checkUsage(d.type)
  }));

  const activeMetrics = diagnosticChecks.filter(d => !d.check.isLocked);
  const highestUsagePercentage = activeMetrics.length > 0 
    ? Math.max(...activeMetrics.map(d => getPercentage(d.check.usage, d.check.limit)))
    : 0;

  const propertyCheck = checkUsage('property');
  const propertiesPercentage = getPercentage(propertyCheck.usage, propertyCheck.limit);

  const showWarning = highestUsagePercentage >= 80 || propertiesPercentage >= 80;
  const atLimit = highestUsagePercentage >= 100 || propertiesPercentage >= 100;

  return (
    <>
      <div className="space-y-6">
        {showWarning && (
          <Alert className={atLimit ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
            <AlertTriangle className={`h-4 w-4 ${atLimit ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                {atLimit ? (
                  <span className="text-red-800 font-medium">
                    You've reached your usage limit. Upgrade your plan to continue.
                  </span>
                ) : (
                  <span className="text-yellow-800">
                    You're at {Math.max(highestUsagePercentage, propertiesPercentage)}% of your quota — consider upgrading for more capacity.
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {tier === 'free' && (
                  <Button size="sm" onClick={handleUpgradeClick}>
                    <Crown className="w-4 h-4 mr-2" />
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

        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Quota resets on: <strong>{formatResetDate(usage.current_period_end)}</strong></span>
          </div>
          <Badge variant="outline" className="capitalize">
            {tier} Plan
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
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
              {diagnosticChecks.map((diagnostic) => {
                const Icon = diagnostic.icon;
                const percentage = getPercentage(diagnostic.check.usage, diagnostic.check.limit);
                const isLocked = diagnostic.check.isLocked;
                const isAtLimit = diagnostic.check.isAtLimit;

                return (
                  <div key={diagnostic.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isLocked ? 'text-muted-foreground' : diagnostic.color}`} />
                        <span className="font-medium">{diagnostic.label}</span>
                        {isLocked && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                        {isAtLimit && !isLocked && (
                          <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                        )}
                      </div>
                      <span 
                        className={`font-semibold ${isLocked ? 'text-muted-foreground' : getTextColor(percentage)}`}
                      >
                        {isLocked ? (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        ) : (
                          <>
                            {diagnostic.check.usage} / {diagnostic.check.limit}
                          </>
                        )}
                      </span>
                    </div>
                    {!isLocked && (
                      <div className="relative">
                        <Progress 
                          value={percentage} 
                          className="h-2 bg-gray-200"
                        />
                        <div 
                          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                    {isLocked && (
                      <div className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded border border-dashed">
                        <span className="text-muted-foreground italic">
                          Upgrade to unlock this diagnostic type
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs"
                          onClick={handleUpgradeClick}
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          Upgrade
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

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
                    {propertyCheck.isAtLimit && (
                      <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                    )}
                  </div>
                  <span 
                    className={`font-semibold ${getTextColor(propertiesPercentage)}`}
                  >
                    {propertyCheck.usage} / {propertyCheck.limit}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={propertiesPercentage} 
                    className="h-2 bg-gray-200"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(propertiesPercentage)}`}
                    style={{ width: `${propertiesPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Property Limits by Plan:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`p-2 rounded-lg border ${tier === 'free' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Free</p>
                      <p className="text-center text-muted-foreground mt-1">1 property</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${tier === 'pro' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Pro</p>
                      <p className="text-center text-muted-foreground mt-1">5 properties</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${tier === 'business' ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                      <p className="font-semibold text-center">Business</p>
                      <p className="text-center text-muted-foreground mt-1">30 properties</p>
                    </div>
                  </div>
                </div>

                {propertiesPercentage >= 80 && tier === 'free' && (
                  <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <p className="font-medium text-primary mb-1">Need more properties?</p>
                    <p>Upgrade to Pro for 5 properties or Business for 30 properties.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {tier === 'free' && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-1">Need More Capacity?</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro or Business for higher limits and advanced features
                  </p>
                </div>
                <Button size="lg" onClick={handleUpgradeClick} className="flex-shrink-0">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Upgrade to unlock more diagnostics, properties, and premium features
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-4">
            {plans.map((plan) => (
              <Card key={plan.tier} className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.tier === 'pro' && (
                      <Badge>Popular</Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold">
                    ₦{(plan.price / 100).toLocaleString('en-NG')}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => initializePayment(plan)}
                    disabled={processingPlan !== null}
                  >
                    {processingPlan === plan.tier ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsageSection;