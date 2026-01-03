import { SEO } from "@/components/SEO";
import { Header } from "@/components/landing/Header";
import PricingSection from "@/components/landing/PricingSection";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Pricing Plans"
        canonicalUrl="/pricing"
        description="Choose the perfect FixSense plan for your needs. Free tier available. Pro and Business plans for Airbnb hosts and property managers with unlimited diagnostics."
        keywords="FixSense pricing, appliance diagnostics pricing, Airbnb maintenance cost, property management software pricing"
      />
      <Header />
      <div className="pt-16">
        <PricingSection />
      </div>
    </div>
  );
};

export default Pricing;