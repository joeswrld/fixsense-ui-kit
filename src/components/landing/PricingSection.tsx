import { Check, Info } from "lucide-react";

// Fixed exchange rate configuration (₦1500 = $1)
const FX_CONFIG = {
  NGN_TO_USD: 1500,
  FALLBACK_RATE: 1500,
};

// Convert NGN to USD for display
const convertToUSD = (ngn: number): string => {
  const usd = ngn / FX_CONFIG.NGN_TO_USD;
  return usd.toFixed(2);
};

const plans = [
  {
    name: "Free",
    priceNGN: 0, // in NGN
    tier: "free",
    features: [
      "2 photo diagnostics per month",
      "0 audio diagnostics (upgrade to unlock)",
      "0 video diagnostics (upgrade to unlock)",
      "3 text diagnostics per month",
      "1 property",
      "Basic support",
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    priceNGN: 5300, // in NGN
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
    cta: "Get Started",
    popular: false
  },
  {
    name: "Host Business",
    priceNGN: 14300, // in NGN
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
    cta: "Get Started",
    popular: true
  }
];

// Price Display Component
const PriceDisplay = ({ ngn }: { ngn: number }) => {
  if (ngn === 0) {
    return (
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold text-gray-900">Free</span>
      </div>
    );
  }

  const ngnFormatted = ngn.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const usdPrice = convertToUSD(ngn);

  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold text-gray-900">₦{ngnFormatted}</span>
        <span className="text-gray-600">/month</span>
      </div>
      <div className="text-sm text-gray-500 mt-1.5">
        (~${usdPrice} USD)
      </div>
    </div>
  );
};

export const PricingSection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-white via-indigo-50/30 to-white">
      <div className="container px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
          
          {/* Payment Disclaimer */}
          <div className="inline-flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 max-w-xl">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-left">
              All payments are securely processed in Nigerian Naira (NGN). 
              <span className="hidden sm:inline"> USD prices shown for reference only.</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                plan.popular 
                  ? 'border-indigo-500 shadow-xl scale-105' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    Recommended
                  </div>
                </div>
              )}
              
              <div className="text-center pb-8 pt-10 px-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{plan.name}</h3>
                <PriceDisplay ngn={plan.priceNGN} />
              </div>

              <div className="p-6 pb-4">
                <ul className="space-y-3.5">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-4">
                <button 
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    console.log(`Selected ${plan.name} plan - NGN ${plan.priceNGN}`);
                    // Navigate to /auth in your actual implementation
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Exchange rate for reference: ₦1,500 = $1 USD
          </p>
          <p className="text-xs text-gray-500 max-w-2xl mx-auto">
            Foreign cards are accepted through Paystack with automatic currency conversion. 
            All subscriptions are billed monthly in Nigerian Naira (NGN).
          </p>
        </div>
      </div>
    </section>
  );
}