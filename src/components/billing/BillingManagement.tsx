import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Loader2, Receipt, Calendar, CreditCard, Download } from "lucide-react";
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
    price: 350000, // ₦3,500 in kobo (₦3,500 × 100)
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
    price: 650000, // ₦6,500 in kobo (₦6,500 × 100)
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

interface Transaction {
  id: string;
  amount: number;
  status: string;
  plan: string;
  reference: string;
  created_at: string;
  payment_method?: string;
}

export const BillingManagement = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
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

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Transaction[];
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
        queryClient.invalidateQueries({ queryKey: ["transactions"] }); // Refresh transactions
        
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

  const downloadReceipt = async (transaction: Transaction) => {
    setDownloadingReceipt(transaction.id);
    
    try {
      // Create receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: #f5f5f5;
            }
            .receipt {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e5e5;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #6366f1;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .success-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 10px;
            }
            .info-section {
              margin: 30px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-label {
              color: #666;
              font-weight: 500;
            }
            .info-value {
              color: #333;
              font-weight: 600;
            }
            .amount-section {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              text-align: center;
            }
            .amount-label {
              color: #666;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .amount-value {
              font-size: 36px;
              font-weight: bold;
              color: #6366f1;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e5e5;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .footer-note {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .receipt {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">🔧 FixSense</div>
              <div class="title">Payment Receipt</div>
              <div class="success-badge">✓ PAID</div>
            </div>

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Receipt Number</span>
                <span class="info-value">${transaction.reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${new Date(transaction.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer Email</span>
                <span class="info-value">${profile?.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plan</span>
                <span class="info-value">${transaction.plan} Plan</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${transaction.payment_method || 'Card'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: #10b981;">SUCCESS</span>
              </div>
            </div>

            <div class="amount-section">
              <div class="amount-label">Amount Paid</div>
              <div class="amount-value">₦${(transaction.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div class="footer">
              <p><strong>Thank you for your payment!</strong></p>
              <p>Your subscription has been activated successfully.</p>
              <div class="footer-note">
                <p>This is a computer-generated receipt and does not require a signature.</p>
                <p>For any questions, please contact support@fixsense.com</p>
                <p>© ${new Date().getFullYear()} FixSense. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a Blob from the HTML
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `FixSense_Receipt_${transaction.reference}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                  ? `₦${(currentPlan?.price ? currentPlan.price / 100 : 0).toLocaleString('en-NG')}/month` 
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
                  {plan.price === 0 ? "Free" : `₦${(plan.price / 100).toLocaleString('en-NG')}`}
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

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Your payment and subscription history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{transaction.plan} Plan</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reference: {transaction.reference}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-lg">
                        ₦{(transaction.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.payment_method}
                        </p>
                      )}
                    </div>
                    {transaction.status.toLowerCase() === "success" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadReceipt(transaction)}
                        disabled={downloadingReceipt === transaction.id}
                      >
                        {downloadingReceipt === transaction.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-2">Your payment history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}