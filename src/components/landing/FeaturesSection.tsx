import { Camera, Video, Mic, DollarSign, AlertTriangle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Camera,
    title: "AI Diagnostics ",
    description: "Upload a video, audio, or photo and get instant repair diagnosis and cost estimate. "
  },
  {
    icon: Video,
    title: "AI Predictive Maintenance Alerts",
    description: "AI-powered failure predictions and recommendations"
  },
  {
    icon: Mic,
    title: "Service Vendor Directory",
    description: "Manage your trusted service providers"
  },
  {
    icon: DollarSign,
    title: "Cost Estimates",
    description: "Get accurate repair cost ranges to budget effectively"
  },
  {
    icon: AlertTriangle,
    title: "Urgency Rating",
    description: "Know what's critical and what can wait - prioritize repairs smartly"
  },
  {
    icon: Wrench,
    title: "Fix Instructions",
    description: "Step-by-step guidance for repairs you can handle yourself"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-accent/20">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="text-primary">Diagnose & Fix</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional-grade diagnostics powered by AI, designed specifically for property managers and hosts
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