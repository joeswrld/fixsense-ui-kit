import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Airbnb Superhost",
    location: "Lagos, Nigeria",
    image: null,
    rating: 5,
    text: "FixSense saved me ₦250,000! A technician quoted me ₦300,000 for a 'complete AC replacement,' but FixSense diagnosed it as a simple refrigerant issue. Cost me only ₦50,000 to fix. Absolute lifesaver!",
    savings: "₦250,000 saved"
  },
  {
    name: "David Okonkwo",
    role: "Property Manager",
    location: "Abuja, Nigeria",
    image: null,
    rating: 5,
    text: "Managing 12 properties means constant appliance issues. FixSense helps me prioritize what's urgent and what can wait. The predictive maintenance alerts have prevented 3 major breakdowns this year alone.",
    properties: "12 properties"
  },
  {
    name: "Amara Chukwu",
    role: "Vacation Rental Host",
    location: "Port Harcourt, Nigeria",
    image: null,
    rating: 5,
    text: "My washing machine broke during peak season. FixSense gave me instant diagnosis at 2 AM! I followed the DIY fix instructions and had it running in 30 minutes. My guests never knew there was a problem.",
    response: "2 AM support"
  }
];

export const SuccessStoriesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-accent/20">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Trusted by <span className="text-primary">Hosts & Property Managers</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of property owners who are saving money and time with AI-powered diagnostics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl relative">
              <CardContent className="pt-6">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {(testimonial.savings || testimonial.properties || testimonial.response) && (
                  <div className="mb-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="text-xs font-semibold text-primary">
                      {testimonial.savings || testimonial.properties || testimonial.response}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
