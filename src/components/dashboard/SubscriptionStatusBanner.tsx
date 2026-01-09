import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";

export const SubscriptionStatusBanner = () => {
  const navigate = useNavigate();
  const { 
    subscription, 
    isLoading, 
    status, 
    tier, 
    daysUntilExpiry, 
    isInGracePeriod, 
    paymentRequired 
  } = useSubscriptionAccess();

  if (isLoading || !subscription) return null;

  // Free users don't need subscription warnings
  if (tier === 'free') return null;

  // Payment failed - in grace period
  if (status === 'past_due' || paymentRequired) {
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <CreditCard className="h-4 w-4" />
        <AlertTitle className="font-semibold">Payment Failed</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>
            Your last payment failed. Please update your payment method to avoid losing access.
            {isInGracePeriod && subscription.gracePeriodEnd && (
              <span className="font-medium">
                {" "}Access ends on {new Date(subscription.gracePeriodEnd).toLocaleDateString()}.
              </span>
            )}
          </span>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate("/settings?tab=billing")}
            className="whitespace-nowrap"
          >
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Subscription expired
  if (status === 'expired' || status === 'cancelled') {
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Subscription Expired</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>
            Your {tier.charAt(0).toUpperCase() + tier.slice(1)} subscription has expired. 
            Renew now to restore access to premium features.
          </span>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate("/settings?tab=billing")}
            className="whitespace-nowrap"
          >
            Renew Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Expiring soon (within 7 days)
  if (daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && status === 'active') {
    return (
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-semibold text-amber-700 dark:text-amber-400">
          Subscription Expiring Soon
        </AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-amber-700 dark:text-amber-300">
            Your {tier.charAt(0).toUpperCase() + tier.slice(1)} subscription expires in{" "}
            <span className="font-semibold">
              {daysUntilExpiry === 1 ? "1 day" : `${daysUntilExpiry} days`}
            </span>
            . Ensure your payment method is up to date.
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate("/settings?tab=billing")}
            className="whitespace-nowrap border-amber-500 text-amber-700 hover:bg-amber-500/20"
          >
            Manage Billing
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Expiring in 14 days - softer warning
  if (daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 7 && status === 'active') {
    return (
      <Alert className="border-primary/30 bg-primary/5">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold">Subscription Renewal Coming Up</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-muted-foreground">
            Your {tier.charAt(0).toUpperCase() + tier.slice(1)} plan renews in {daysUntilExpiry} days.
          </span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate("/settings?tab=billing")}
            className="whitespace-nowrap"
          >
            View Billing
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
