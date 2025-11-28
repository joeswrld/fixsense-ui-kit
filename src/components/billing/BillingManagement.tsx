import { useState, useEffect } from "react";
import { Check, CheckCircle2, Crown, Loader2, Receipt, Calendar, CreditCard, Download, Info } from "lucide-react";

// Fixed exchange rate configuration (₦1500 = $1)
const FX_CONFIG = {
  NGN_TO_USD: 1500,
  FALLBACK_RATE: 1500,
};

// Convert kobo to USD for display
const convertToUSD = (kobo: number): string => {
  const ngn = kobo / 100;
  const usd = ngn / FX_CONFIG.NGN_TO_USD;
  return usd.toFixed(2);
};

const plans = [
  {
    name: "Free",
    price: 0, // in kobo
    tier: "free",
    features: [
      "2 photo diagnostics per month",
      "0 audio diagnostics",
      "0 video diagnostics (upgrade to unlock)",
      "3 text diagnostics per month",
      "1 property",
      "Basic support",
      "Full history",
    ],
  },
  {
    name: "Pro",
    price: 530000, // ₦5,300 in kobo
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
  },
  {
    name: "Host Business",
    price: 1430000, // ₦14,300 in kobo
    tier: "business",
    features: [
      "60 photo diagnostics per month",
      "20 audio diagnostics per month",
      "5 video diagnostics per month",
      "150 text diagnostics per month",
      "30 properties",
      "AI Predictive Maintenance Alerts",
      "Advanced analytics",
      "Dedicated support",
      "Warranty Information",
      "Service Vendor Directory",
      "Maintenance History",
    ],
    popular: true,
  },
];

// Price Display Component
const PriceDisplay = ({ kobo, className = "" }: { kobo: number; className?: string }) => {
  if (kobo === 0) {
    return <div className={`text-4xl font-bold ${className}`}>Free</div>;
  }

  const ngnPrice = (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const usdPrice = convertToUSD(kobo);

  return (
    <div className={className}>
      <div className="text-4xl font-bold text-gray-900">
        ₦{ngnPrice}
        <span className="text-lg font-normal text-gray-500">/month</span>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        (~${usdPrice} USD)
      </div>
    </div>
  );
};

// Pricing Card Component
const PricingCard = ({ 
  plan, 
  isCurrentPlan, 
  onSelect, 
  isProcessing 
}: { 
  plan: typeof plans[0]; 
  isCurrentPlan: boolean; 
  onSelect: () => void; 
  isProcessing: boolean;
}) => {
  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all ${
        plan.popular
          ? "border-indigo-500 shadow-xl scale-105"
          : isCurrentPlan
          ? "border-indigo-300"
          : "border-gray-200 hover:border-indigo-300"
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Crown className="w-4 h-4" />
            Recommended
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Plan Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            {isCurrentPlan && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                Current
              </span>
            )}
          </div>
          <PriceDisplay kobo={plan.price} />
        </div>

        {/* Features List */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          disabled={isCurrentPlan || isProcessing}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            isCurrentPlan
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : plan.popular
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : plan.tier === "free" ? (
            "Free Forever"
          ) : (
            "Upgrade Now"
          )}
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function DualPriceBilling() {
  const [currentTier, setCurrentTier] = useState("free");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [transactions] = useState([
    {
      id: "1",
      plan: "Pro",
      amount: 530000,
      status: "success",
      reference: "PST_123456789",
      created_at: new Date().toISOString(),
      payment_method: "card",
    },
  ]);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (plan.tier === "free" || plan.tier === currentTier) return;

    setProcessingPlan(plan.tier);

    // Simulate payment initialization
    setTimeout(() => {
      console.log("Initializing Paystack payment with NGN amount:", plan.price);
      console.log("Amount in NGN:", (plan.price / 100).toFixed(2));
      console.log("USD reference only:", convertToUSD(plan.price));
      
      // In production: redirect to Paystack with NGN amount only
      alert(`Would redirect to Paystack with ₦${(plan.price / 100).toFixed(2)} NGN`);
      setProcessingPlan(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
          
          {/* Payment Disclaimer */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
            <Info className="w-4 h-4" />
            <span>
              All payments are securely processed in Nigerian Naira (NGN). USD prices shown for reference only.
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              isCurrentPlan={plan.tier === currentTier}
              onSelect={() => handleSelectPlan(plan)}
              isProcessing={processingPlan === plan.tier}
            />
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{transaction.plan} Plan</p>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                          ✓ Success
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        Reference: {transaction.reference}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-900">
                      ₦{(transaction.amount / 100).toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      (~${convertToUSD(transaction.amount)} USD)
                    </p>
                    <button className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No transactions yet</p>
              <p className="text-sm mt-2">Your payment history will appear here</p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Exchange rate for reference: ₦1,500 = $1 USD • Prices are in Nigerian Naira (NGN)
          </p>
          <p className="mt-2">
            Foreign cards are accepted through Paystack with automatic currency conversion
          </p>
        </div>
      </div>
    </div>
  );
}