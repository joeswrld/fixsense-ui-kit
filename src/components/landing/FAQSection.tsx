import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";

const faqs = [
  {
    question: "How accurate are the AI diagnostics?",
    answer: "Our AI has a 98% accuracy rate, trained on thousands of appliance issues and repair cases. It analyzes visual, audio, and text inputs to provide reliable diagnostics comparable to professional technicians."
  },
  {
    question: "What types of appliances does FixSense support?",
    answer: "FixSense supports all major home appliances including air conditioners, refrigerators, washing machines, dryers, dishwashers, microwaves, ovens, water heaters, and more. We're constantly expanding our database."
  },
  {
    question: "Do I need technical knowledge to use FixSense?",
    answer: "Not at all! Simply take a photo, record a video/audio, or describe the problem in plain language. Our AI handles the technical analysis and provides easy-to-understand results."
  },
  {
    question: "How do the cost estimates work?",
    answer: "We provide cost ranges in Nigerian Naira based on typical repair costs in your region. These estimates help you budget and identify when a technician might be overcharging."
  },
  {
    question: "Can I use FixSense for properties outside Nigeria?",
    answer: "Yes! While our pricing is in Naira, FixSense works globally. Cost estimates will be shown in your local currency for reference."
  },
  {
    question: "What if I need professional help after diagnosis?",
    answer: "Business plan subscribers get access to our verified vendor directory where you can book trusted service providers directly through the platform."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about FixSense
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