import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { SuccessStoriesSection } from "@/components/landing/SuccessStoriesSection";
import PricingSection from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Link } from "react-router-dom";
import { Mail, Twitter, Linkedin, Instagram } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      
      <div id="features">
        <FeaturesSection />
      </div>

      <HowItWorksSection />
      
      <StatsSection />
      
      <SuccessStoriesSection />
      
      <div id="pricing">
        <PricingSection />
      </div>

      <FAQSection />
      
      <CTASection />
      
      {/* Enhanced Footer */}
      <footer className="border-t bg-gradient-to-br from-accent/10 via-background to-accent/5">
        <div className="container px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground">🔧</span>
                </div>
                <span>FixSense</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                AI-powered appliance diagnostics for Airbnb hosts and property managers. 
                Save time, avoid scams, and keep your properties running smoothly.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/features" className="hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-primary transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FixSense. All rights reserved.</p>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;