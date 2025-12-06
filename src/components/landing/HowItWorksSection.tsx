import { Upload, Brain, Wrench, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Upload,
      step: "01",
      title: t('landing.howItWorks.step1Title'),
      description: t('landing.howItWorks.step1Desc'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Brain,
      step: "02",
      title: t('landing.howItWorks.step2Title'),
      description: t('landing.howItWorks.step2Desc'),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Wrench,
      step: "03",
      title: t('landing.howItWorks.step3Title'),
      description: t('landing.howItWorks.step3Desc'),
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CheckCircle,
      step: "04",
      title: t('landing.howItWorks.step4Title'),
      description: t('landing.howItWorks.step4Desc'),
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('landing.howItWorks.title')}{" "}
            <span className="text-primary">{t('landing.howItWorks.titleHighlight')}</span>{" "}
            {t('landing.howItWorks.titleEnd')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">{t('landing.howItWorks.step')} {step.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 border-4 border-background z-10">
                    <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};