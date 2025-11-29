import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Info, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Exchange rate configuration
const FX_CONFIG = {
  NGN_TO_USD: 1500,
};

const convertToUSD = (ngn: number) => {
  const usd = ngn / FX_CONFIG.NGN_TO_USD;
  return usd.toFixed(2);
};

const plans = [
  {
    name: "Free",
    priceNGN: 0,
    priceKobo: 0,
    tier: "free",
    features: [
      "2 photo diagnostics per month",
      "0 audio diagnostics (upgrade to unlock)",
      "0 video diagnostics (upgrade to unlock)",
      "3 text diagnostics per month",
      "1 property",
      "Basic support",
    ],
    cta: "Current Plan",
    popular: false
  },
  {
    name: "Pro",
    priceNGN: 5300,
    priceKobo: 530000,
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
    cta: "Upgrade to Pro",
    popular: false
  },
  {
    name: "Host Business",
    priceNGN: 14300,
    priceKobo: 1430000,
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
    cta: "Upgrade to Business",
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

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle checkout after login redirect
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (user && planFromUrl && !processingPlan) {
      const plan = plans.find(p => p.tier === planFromUrl);
      if (plan && plan.tier !== 'free') {
        handlePricingAction(plan);
      }
    }
  }, [user, searchParams]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', currentUser.id)
          .single();
        
        setCurrentTier(profile?.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const initializePaystackCheckout = async (plan: typeof plans[0]) => {
    try {
      setProcessingPlan(plan.tier);

      const { data, error } = await supabase.functions.invoke(
        "paystack-initialize-transaction",
        {
          body: {
            email: user.email,
            amount: plan.priceKobo,
            plan: plan.name,
            callback_url: window.location.origin + "/settings?tab=billing",
          },
        }
      );

      if (error) throw error;

      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('Failed to initialize payment. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handlePricingAction = async (plan: typeof plans[0]) => {
    // Don't proceed if already processing
    if (processingPlan) return;

    // Free plan or current plan - do nothing
    if (plan.tier === 'free' || plan.tier === currentTier) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // Redirect to auth with plan in URL
      navigate(`/auth?redirect=pricing&plan=${plan.tier}`);
      return;
    }

    // User is authenticated - proceed to checkout
    await initializePaystackCheckout(plan);
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (processingPlan === plan.tier) {
      return 'Redirecting to Checkout...';
    }
    
    if (!user) {
      return plan.tier === 'free' ? 'Get Started' : 'Sign Up to Upgrade';
    }
    
    if (plan.tier === currentTier) {
      return 'Current Plan';
    }
    
    if (plan.tier === 'free') {
      return 'Downgrade';
    }
    
    return user ? 'Proceed to Checkout' : plan.cta;
  };

  const isButtonDisabled = (plan: typeof plans[0]) => {
    return processingPlan !== null || (user && plan.tier === currentTier);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white py-20 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
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

          {/* User Status Banner */}
          {user && (
            <div className="mt-6 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-800">
              <Crown className="w-4 h-4" />
              <span>Current Plan: <strong className="capitalize">{currentTier}</strong></span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
          {plans.map((plan, index) => {
            const isCurrentPlan = user && plan.tier === currentTier;
            
            return (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                  plan.popular 
                    ? 'border-indigo-500 shadow-xl scale-105' 
                    : isCurrentPlan
                    ? 'border-green-500 shadow-lg'
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

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Current Plan
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
                      isCurrentPlan
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : plan.popular 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed' 
                        : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    onClick={() => handlePricingAction(plan)}
                    disabled={isButtonDisabled(plan)}
                  >
                    {processingPlan === plan.tier && (
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    )}
                    {getButtonText(plan)}
                  </button>
                </div>
              </div>
            );
          })}
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
    </div>
  );
};

export default PricingPage;
