import React from 'react';
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

interface UsageSectionProps {
  photoUsed: number;
  photoLimit: number;
  audioUsed: number;
  audioLimit: number;
  videoUsed: number;
  videoLimit: number;
  textUsed: number;
  textLimit: number;
  propertiesUsed: number;
  propertiesLimit: number;
  resetDate: string;
  tier: 'free' | 'pro' | 'business';
  onBuyCredits?: () => void;
  onUpgrade?: () => void;
}

interface UsageMetric {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number;
  color: string;
}

const UsageSection: React.FC<UsageSectionProps> = ({
  photoUsed,
  photoLimit,
  audioUsed,
  audioLimit,
  videoUsed,
  videoLimit,
  textUsed,
  textLimit,
  propertiesUsed,
  propertiesLimit,
  resetDate,
  tier,
  onBuyCredits,
  onUpgrade
}) => {
  const getPercentage = (used: number, limit: number): number => {
    if (limit === 0) return 100;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getTextColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-foreground';
  };

  const diagnostics: UsageMetric[] = [
    {
      label: 'Photo Diagnostics',
      icon: Camera,
      used: photoUsed,
      limit: photoLimit,
      color: 'text-blue-600'
    },
    {
      label: 'Audio Diagnostics',
      icon: Mic,
      used: audioUsed,
      limit: audioLimit,
      color: 'text-purple-600'
    },
    {
      label: 'Video Diagnostics',
      icon: Video,
      used: videoUsed,
      limit: videoLimit,
      color: 'text-green-600'
    },
    {
      label: 'Text Diagnostics',
      icon: FileText,
      used: textUsed,
      limit: textLimit,
      color: 'text-orange-600'
    }
  ];

  // Check if any diagnostic type is at or near limit
  const highestUsagePercentage = Math.max(
    getPercentage(photoUsed, photoLimit),
    getPercentage(audioUsed, audioLimit),
    getPercentage(videoUsed, videoLimit),
    getPercentage(textUsed, textLimit)
  );

  const propertiesPercentage = getPercentage(propertiesUsed, propertiesLimit);
  const showWarning = highestUsagePercentage >= 80 || propertiesPercentage >= 80;
  const atLimit = highestUsagePercentage >= 100 || propertiesPercentage >= 100;

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
                  You've reached your usage limit. Upgrade your plan or purchase credits to continue.
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
          <span>Quota resets on: <strong>{formatResetDate(resetDate)}</strong></span>
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
                  aria-label={`${propertiesUsed} of ${propertiesLimit} properties managed`}
                >
                  {propertiesUsed} / {propertiesLimit}
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

            {/* Property Limit Information */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="flex-1 text-sm">
                  <p className="font-medium mb-1">Your Plan Includes:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Up to {propertiesLimit} {propertiesLimit === 1 ? 'property' : 'properties'}</li>
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

              {propertiesPercentage >= 80 && tier === 'free' && (
                <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="font-medium text-primary mb-1">Need more properties?</p>
                  <p>Upgrade to Pro for 10 properties or Business for 50 properties.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
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
              {onUpgrade && (
                <Button size="lg" onClick={onUpgrade} className="flex-shrink-0">
                  Upgrade Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Example Usage
const UsageSectionDemo = () => {
  const [showBuyCredits, setShowBuyCredits] = React.useState(false);

  // Example data for Free tier user
  const exampleData = {
    photoUsed: 2,
    photoLimit: 2,
    audioUsed: 0,
    audioLimit: 0,
    videoUsed: 0,
    videoLimit: 0,
    textUsed: 1,
    textLimit: 2,
    propertiesUsed: 1,
    propertiesLimit: 1,
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    tier: 'free' as const
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usage & Billing</h1>
          <p className="text-muted-foreground">
            Monitor your usage and manage your subscription
          </p>
        </div>

        <UsageSection
          {...exampleData}
          onBuyCredits={() => setShowBuyCredits(true)}
          onUpgrade={() => console.log('Navigate to upgrade')}
        />

        {showBuyCredits && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Buy Additional Credits</CardTitle>
                <CardDescription>
                  Purchase credit packs for one-time use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This feature would integrate with your existing credit purchase flow.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowBuyCredits(false)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageSectionDemo;