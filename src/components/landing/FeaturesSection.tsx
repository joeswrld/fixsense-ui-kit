import { Camera, Video, Mic, DollarSign, AlertTriangle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Camera,
      title: t('landing.features.aiDiagnosis'),
      description: t('landing.features.aiDiagnosisDesc')
    },
    {
      icon: Video,
      title: t('landing.features.predictiveMaintenance'),
      description: t('landing.features.predictiveMaintenanceDesc')
    },
    {
      icon: Mic,
      title: t('landing.features.vendorDirectory'),
      description: t('landing.features.vendorDirectoryDesc')
    },
    {
      icon: DollarSign,
      title: t('landing.features.costEstimates'),
      description: t('landing.features.costEstimatesDesc')
    },
    {
      icon: AlertTriangle,
      title: t('landing.features.urgencyRating'),
      description: t('landing.features.urgencyRatingDesc')
    },
    {
      icon: Wrench,
      title: t('landing.features.fixInstructions'),
      description: t('landing.features.fixInstructionsDesc')
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-accent/20">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('landing.features.title')}{" "}
            <span className="text-primary">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};