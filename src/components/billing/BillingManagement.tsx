import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: 0,
    tier: "free",
    features: ["2 diagnostics per month", "Basic support", "View past reports"],
  },
  {
    name: "Pro",
    price: 2900, // ₦29 in kobo
    tier: "pro",
    features: [
      "Unlimited diagnostics",
      "Full history",
      "Price predictions",
      "Scam protection alerts",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Host Business",
    price: 9900, // ₦99 in kobo
    tier: "business",
    features: [
      "Everything in Pro",
      "Multi-property support",
      "Team access",
      "Advanced analytics",
      "Dedicated support",
    ],
  },
];

export const BillingManagement = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check for payment reference in URL (returned from Paystack)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || urlParams.get('trxref');
    
    if (reference) {
      verifyPayment(reference);
    }
  }, []);

  const verifyPayment = async (reference: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify-transaction", {
        body: { reference },
      });

      if (error) throw error;

      if (data?.data?.status === "success") {
        toast.success("Payment successful! Your subscription is now active.");
        await refetch(); // Refresh profile data
        
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('reference');
        url.searchParams.delete('trxref');
        window.history.replaceState({}, '', url.toString());
      } else {
        toast.error("Payment verification failed. Please contact support.");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Failed to verify payment. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

  const initializePayment = async (plan: typeof plans[0]) => {
    try {
      setProcessingPlan(plan.tier);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("paystack-initialize-transaction", {
        body: {
          email: profile?.email || user.email,
          amount: plan.price,
          plan: plan.name,
          callback_url: window.location.origin + "/settings?tab=billing",
        },
      });

      if (error) throw error;

      // Redirect to Paystack payment page
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

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("paystack-cancel-subscription");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Subscription cancelled successfully");
    },
    onError: (error) => {
      toast.error("Failed to cancel subscription");
      console.error(error);
    },
  });

  if (isLoading || verifying) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const currentTier = profile?.subscription_tier || "free";
  const isActive = profile?.subscription_status === "active";
  const isPaidUser = isActive && currentTier !== "free";
  const currentPlan = plans.find(p => p.tier === currentTier);

  return (
    <div className="space-y-6">
      {/* Current Plan Status - Always Visible */}
      <Card className={isPaidUser ? "border-primary" : ""}>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your active plan and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-xl">
                  {currentPlan?.name || "Free"} Plan
                </h3>
                {isPaidUser ? (
                  <Badge variant="default" className="gap-1">
                    <Crown className="w-3 h-3" />
                    Paid User
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Free Tier
                  </Badge>
                )}
                {isPaidUser && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {isPaidUser 
                  ? `₦${(currentPlan?.price || 0) / 100}/month` 
                  : "No active subscription"}
              </p>
              
              {isPaidUser && profile?.subscription_end_date && (
                <p className="text-sm text-muted-foreground mt-2">
                  Renews on {new Date(profile.subscription_end_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
            
            {isPaidUser && (
              <Button
                variant="outline"
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.tier} 
              className={`${plan.popular ? "border-primary" : ""} ${plan.tier === currentTier ? "bg-accent/5" : ""}`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg">
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.tier === currentTier && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? "Free" : `₦${(plan.price / 100).toFixed(0)}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
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
                  variant={plan.tier === currentTier ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.tier === currentTier || processingPlan !== null}
                  onClick={() => plan.tier !== "free" && initializePayment(plan)}
                >
                  {processingPlan === plan.tier
                    ? "Processing..."
                    : plan.tier === currentTier
                    ? isPaidUser ? "Current Plan" : "Free Plan"
                    : plan.tier === "free"
                    ? "Free Forever"
                    : currentTier === "free" 
                    ? "Upgrade Now" 
                    : "Switch Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}