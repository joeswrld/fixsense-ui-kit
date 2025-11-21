import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <footer className="border-t py-8 bg-accent/10">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 FixSense. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;