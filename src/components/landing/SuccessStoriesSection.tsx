import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

export const SuccessStoriesSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('landing.successStories.testimonial1Name'),
      role: t('landing.successStories.testimonial1Role'),
      location: t('landing.successStories.testimonial1Location'),
      image: null,
      rating: 5,
      text: t('landing.successStories.testimonial1Text'),
      highlight: t('landing.successStories.testimonial1Savings')
    },
    {
      name: t('landing.successStories.testimonial2Name'),
      role: t('landing.successStories.testimonial2Role'),
      location: t('landing.successStories.testimonial2Location'),
      image: null,
      rating: 5,
      text: t('landing.successStories.testimonial2Text'),
      highlight: t('landing.successStories.testimonial2Properties')
    },
    {
      name: t('landing.successStories.testimonial3Name'),
      role: t('landing.successStories.testimonial3Role'),
      location: t('landing.successStories.testimonial3Location'),
      image: null,
      rating: 5,
      text: t('landing.successStories.testimonial3Text'),
      highlight: t('landing.successStories.testimonial3Response')
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-accent/20">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('landing.successStories.title')}{" "}
            <span className="text-primary">{t('landing.successStories.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.successStories.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl relative">
              <CardContent className="pt-6">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {testimonial.highlight && (
                  <div className="mb-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="text-xs font-semibold text-primary">
                      {testimonial.highlight}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};