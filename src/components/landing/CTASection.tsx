import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-accent/30 via-background to-primary/5">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('landing.cta.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold">
            {t('landing.cta.title')}{" "}
            <span className="text-primary">{t('landing.cta.titleHighlight')}</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" asChild className="min-w-[200px] group">
              <Link to="/auth">
                {t('landing.cta.getStartedFree')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[200px]">
              <Link to="/pricing">{t('landing.cta.viewPricing')}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span>{t('landing.cta.freeTierAvailable')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span>{t('landing.cta.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span>{t('landing.cta.cancelAnytime')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};