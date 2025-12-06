import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('landing.faq.q1'),
      answer: t('landing.faq.a1')
    },
    {
      question: t('landing.faq.q2'),
      answer: t('landing.faq.a2')
    },
    {
      question: t('landing.faq.q3'),
      answer: t('landing.faq.a3')
    },
    {
      question: t('landing.faq.q4'),
      answer: t('landing.faq.a4')
    },
    {
      question: t('landing.faq.q5'),
      answer: t('landing.faq.a5')
    },
    {
      question: t('landing.faq.q6'),
      answer: t('landing.faq.a6')
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('landing.faq.title')}{" "}
            <span className="text-primary">{t('landing.faq.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-semibold pr-8">{faq.question}</h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {openIndex === index && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};