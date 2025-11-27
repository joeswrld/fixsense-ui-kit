import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "/month",
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
    price: "₦5,300",
    period: "/month",
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
  },
  {
    name: "Host Business",
    price: "₦14,300",
    period: "/month",
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

export const PricingSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Simple, Transparent{" "}
            <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary border-2 shadow-xl' : 'border-2'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1">Recommended</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};