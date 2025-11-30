
import { Upload, Brain, Wrench, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Issue",
    description: "Take a photo, record a video or audio of the malfunctioning appliance. You can also describe the problem in text.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Brain,
    step: "02",
    title: "AI Analysis",
    description: "Our advanced AI analyzes your input instantly, identifying the problem and comparing it against thousands of known issues.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Wrench,
    step: "03",
    title: "Get Diagnosis",
    description: "Receive a detailed diagnosis with probable causes, cost estimates, urgency rating, and step-by-step repair instructions.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Fix or Schedule",
    description: "Follow DIY instructions for simple fixes or book a trusted vendor from our directory for professional service.",
    color: "from-green-500 to-emerald-500"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How <span className="text-primary">FixSense</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get professional appliance diagnostics in four simple steps. No technical knowledge required.
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
                  <div className="text-xs font-bold text-muted-foreground mb-2">STEP {step.step}</div>
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
