import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Crown,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { useSubscriptionEnforcement } from '@/hooks/useSubscriptionEnforcement';

interface SubscriptionStatusAlertProps {
  onUpgrade?: () => void;
  onRenew?: () => void;
}

export const SubscriptionStatusAlert: React.FC<SubscriptionStatusAlertProps> = ({
  onUpgrade,
  onRenew,
}) => {
  const { subscription, isLoading, getDaysUntilReset } = useSubscriptionEnforcement();

  if (isLoading || !subscription) return null;

  const daysUntilReset = getDaysUntilReset();

  // Expired subscription - immediate downgrade notice
  if (subscription.isExpired && subscription.tier !== 'free') {
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Subscription Expired</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <span>
            Your subscription has expired and you've been downgraded to the Free plan. 
            Renew now to restore access to premium features.
          </span>
          <Button size="sm" onClick={onRenew || onUpgrade}>
            <Crown className="w-4 h-4 mr-2" />
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Past due with grace period
  if (subscription.isPastDue && subscription.isInGracePeriod) {
    return (
      <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-200">Payment Failed</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div>
            <span className="text-orange-700 dark:text-orange-300">
              Your last payment failed. You have{' '}
              <strong>{subscription.gracePeriodDaysRemaining} days</strong> remaining 
              in your grace period before being downgraded to the Free plan.
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={onRenew || onUpgrade} className="border-orange-500 text-orange-700 hover:bg-orange-100">
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Subscription expiring soon
  if (subscription.needsRenewal && subscription.daysUntilExpiry !== null && subscription.daysUntilExpiry <= 7) {
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Renewal Reminder</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <span className="text-yellow-700 dark:text-yellow-300">
            Your subscription renews in <strong>{subscription.daysUntilExpiry} day{subscription.daysUntilExpiry === 1 ? '' : 's'}</strong>.
            Ensure your payment method is up to date.
          </span>
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            Auto-renews on {subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate).toLocaleDateString() : 'N/A'}
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription info
  if (subscription.isActive && daysUntilReset !== null) {
    return (
      <Alert className="mb-6 border-green-500/30 bg-green-50/50 dark:bg-green-950/30">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">Active Subscription</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4 mt-1">
          <span className="text-green-700 dark:text-green-300 text-sm">
            Your {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan is active. 
            Usage resets in <strong>{daysUntilReset} days</strong>.
          </span>
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
