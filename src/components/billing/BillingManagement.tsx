import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";
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
    price: 2000, // in NGN or your currency (kobo)
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
    price: 5000,
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
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
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
          callback_url: window.location.origin + "/dashboard?tab=billing",
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const currentTier = profile?.subscription_tier || "free";
  const isActive = profile?.subscription_status === "active";

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      {isActive && currentTier !== "free" && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your active subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {plans.find((p) => p.tier === currentTier)?.name || "Pro"}
                  <Badge variant="default" className="ml-2">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </h3>
                {profile?.subscription_end_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Renews on {new Date(profile.subscription_end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.tier} className={plan.popular ? "border-primary" : ""}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg">
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? "Free" : `₦${(plan.price / 100).toFixed(2)}`}
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
                    ? "Current Plan"
                    : plan.tier === "free"
                    ? "Free Forever"
                    : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
