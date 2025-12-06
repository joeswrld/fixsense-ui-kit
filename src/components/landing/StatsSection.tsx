import { TrendingUp, Users, Shield, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      value: "5,000+",
      label: t('landing.stats.activeUsers'),
      description: t('landing.stats.activeUsersDesc')
    },
    {
      icon: TrendingUp,
      value: "₦500M+",
      label: t('landing.stats.moneySaved'),
      description: t('landing.stats.moneySavedDesc')
    },
    {
      icon: Shield,
      value: "98%",
      label: t('landing.stats.accuracyRate'),
      description: t('landing.stats.accuracyRateDesc')
    },
    {
      icon: Clock,
      value: "< 2 min",
      label: t('landing.stats.avgResponse'),
      description: t('landing.stats.avgResponseDesc')
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
      <div className="container px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-1 text-primary-foreground/90">{stat.label}</div>
              <div className="text-sm text-primary-foreground/70">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};