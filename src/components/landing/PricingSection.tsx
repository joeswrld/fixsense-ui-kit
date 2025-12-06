import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Info, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

const FX_CONFIG = {
  NGN_TO_USD: 1500,
};

const convertToUSD = (ngn: number) => {
  const usd = ngn / FX_CONFIG.NGN_TO_USD;
  return usd.toFixed(2);
};

const plans = [
  {
    nameKey: "free",
    priceNGN: 0,
    priceKobo: 0,
    tier: "free",
    featureKeys: [
      { key: "photoDiagnostics", count: 2 },
      { key: "audioDiagnostics", count: 0, locked: true },
      { key: "videoDiagnostics", count: 0, locked: true },
      { key: "textDiagnostics", count: 3 },
      { key: "properties", count: 1 },
      { key: "basicSupport", count: null },
    ],
    popular: false
  },
  {
    nameKey: "pro",
    priceNGN: 5300,
    priceKobo: 530000,
    tier: "pro",
    featureKeys: [
      { key: "photoDiagnostics", count: 30 },
      { key: "audioDiagnostics", count: 10 },
      { key: "videoDiagnostics", count: 2 },
      { key: "textDiagnostics", count: 40 },
      { key: "properties", count: 5 },
      { key: "fullHistory", count: null },
      { key: "prioritySupport", count: null },
    ],
    popular: false
  },
  {
    nameKey: "business",
    priceNGN: 14300,
    priceKobo: 1430000,
    tier: "business",
    featureKeys: [
      { key: "photoDiagnostics", count: 60 },
      { key: "audioDiagnostics", count: 20 },
      { key: "videoDiagnostics", count: 5 },
      { key: "textDiagnostics", count: 150 },
      { key: "properties", count: 30 },
      { key: "advancedAnalytics", count: null },
      { key: "dedicatedSupport", count: null },
      { key: "warrantyInfo", count: null },
      { key: "maintenanceHistory", count: null },
    ],
    popular: true
  }
];

const PriceDisplay = ({ ngn, t }: { ngn: number; t: any }) => {
  if (ngn === 0) {
    return (
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold text-foreground">{t('landing.pricing.free')}</span>
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
        <span className="text-4xl font-bold text-foreground">₦{ngnFormatted}</span>
        <span className="text-muted-foreground">{t('landing.pricing.perMonth')}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1.5">
        (~${usdPrice} USD)
      </div>
    </div>
  );
};

export const PricingSection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, []);

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
            plan: t(`landing.pricing.${plan.nameKey}`),
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
    if (processingPlan) return;
    if (plan.tier === 'free') return;
    if (plan.tier === currentTier) return;

    if (!user) {
      navigate(`/auth?redirect=pricing&plan=${plan.tier}`);
      return;
    }

    await initializePaystackCheckout(plan);
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (processingPlan === plan.tier) {
      return t('landing.pricing.redirectingToCheckout');
    }
    
    if (plan.tier === currentTier) {
      return t('landing.pricing.currentPlan');
    }
    
    if (plan.tier === 'free') {
      return user ? t('landing.pricing.currentPlan') : t('common.getStarted');
    }
    
    if (!user) {
      return t('landing.pricing.signUpToUpgrade');
    }
    
    return t('landing.pricing.proceedToCheckout');
  };

  const isButtonDisabled = (plan: typeof plans[0]) => {
    if (processingPlan !== null) return true;
    if (user && plan.tier === currentTier) return true;
    if (user && plan.tier === 'free') return true;
    return false;
  };

  const getFeatureText = (feature: { key: string; count: number | null; locked?: boolean }) => {
    if (feature.count === null) {
      return t(`landing.pricing.features.${feature.key}`);
    }
    if (feature.locked) {
      return `${feature.count} ${t(`landing.pricing.features.${feature.key}`)} (${t('landing.pricing.signUpToUpgrade').split(' ')[0]})`;
    }
    return `${feature.count} ${t(`landing.pricing.features.${feature.key}`)}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background py-20 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            {t('landing.pricing.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('landing.pricing.titleHighlight')}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {t('landing.pricing.subtitle')}
          </p>
          
          <div className="inline-flex items-start gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-800 dark:text-blue-200 max-w-xl">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-left">
              {t('landing.pricing.paymentDisclaimer')}
              <span className="hidden sm:inline"> {t('landing.pricing.usdReference')}</span>
            </span>
          </div>

          {user && (
            <div className="mt-6 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
              <Crown className="w-4 h-4" />
              <span>{t('landing.pricing.currentPlan')}: <strong className="capitalize">{currentTier}</strong></span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
          {plans.map((plan, index) => {
            const isCurrentPlan = user && plan.tier === currentTier;
            
            return (
              <div 
                key={index} 
                className={`relative bg-card rounded-2xl border-2 transition-all hover:shadow-xl ${
                  plan.popular 
                    ? 'border-primary shadow-xl scale-105' 
                    : isCurrentPlan
                    ? 'border-green-500 shadow-lg'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      {t('landing.pricing.recommended')}
                    </div>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {t('landing.pricing.currentPlan')}
                    </div>
                  </div>
                )}
                
                <div className="text-center pb-8 pt-10 px-6 border-b border-border">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{t(`landing.pricing.${plan.nameKey}`)}</h3>
                  <PriceDisplay ngn={plan.priceNGN} t={t} />
                </div>

                <div className="p-6 pb-4">
                  <ul className="space-y-3.5">
                    {plan.featureKeys.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{getFeatureText(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-4">
                  <button 
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-default'
                        : plan.popular 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed' 
                        : 'bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed'
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

        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('landing.pricing.exchangeRate')}
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            {t('landing.pricing.foreignCards')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;