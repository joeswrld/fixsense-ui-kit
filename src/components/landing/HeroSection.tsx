import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { Sparkles, ShieldCheck, TrendingUp, ArrowRight, Play } from "lucide-react";
import { useState } from "react";

export const HeroSection = () => {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Animated Background Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">AI-Powered Diagnostics for Smart Hosts</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in-up">
            AI Diagnostics for{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Airbnb
            </span>{" "}
            &{" "}
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Home Appliances
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Upload a video, audio, or photo and get instant repair diagnosis and cost estimate. 
            Save time, avoid scams, and keep your properties running smoothly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up delay-300">
            <Button size="lg" asChild className="min-w-[200px] group shadow-xl hover:shadow-2xl transition-all">
              <Link to="/auth">
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="min-w-[200px] group backdrop-blur-sm"
              onClick={() => setVideoOpen(true)}
            >
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm animate-fade-in-up delay-500">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="font-medium">Scam Protection</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Cost Estimates</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Instant Analysis</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-8 animate-fade-in-up delay-700">
            <p className="text-sm text-muted-foreground mb-4">Trusted by property managers worldwide</p>
            <div className="flex justify-center items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium ml-2">5,000+ active users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div className="max-w-4xl w-full aspect-video bg-card rounded-lg overflow-hidden shadow-2xl">
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p>Demo video coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .delay-700 {
          animation-delay: 0.7s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
};