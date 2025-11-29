import { Header } from "@/components/landing/Header";
import  PricingSection  from "@/components/landing/PricingSection";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <PricingSection />
      </div>
    </div>
  );
};

export default Pricing;