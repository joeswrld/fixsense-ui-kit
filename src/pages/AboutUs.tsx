import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Users, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold">About FixSense</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to revolutionize how property managers and homeowners 
              diagnose and maintain their appliances.
            </p>
          </section>

          {/* Mission Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              FixSense was founded with a simple goal: to empower property owners with 
              instant, accurate appliance diagnostics. We understand that unexpected 
              appliance failures can be costly and stressful, especially for Airbnb hosts 
              and property managers who need to ensure their properties are always guest-ready.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Using advanced AI technology, we analyze photos, videos, and descriptions 
              of appliance issues to provide instant diagnoses, repair cost estimates, 
              and step-by-step fix instructions. Our platform also includes scam protection 
              features to help you avoid overcharging and unnecessary repairs.
            </p>
          </section>

          {/* Values Grid */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Values</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Accuracy</h3>
                      <p className="text-sm text-muted-foreground">
                        We use cutting-edge AI to provide the most accurate diagnoses possible, 
                        continuously improving our models with real-world data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">User-First</h3>
                      <p className="text-sm text-muted-foreground">
                        Every feature we build is designed with our users in mind, 
                        from intuitive interfaces to actionable insights.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Trust</h3>
                      <p className="text-sm text-muted-foreground">
                        We're committed to transparency, honest pricing, and protecting 
                        our users from scams and overcharging.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wrench className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Innovation</h3>
                      <p className="text-sm text-muted-foreground">
                        We continuously evolve our technology to stay ahead of the curve 
                        and provide the best diagnostic tools available.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Team Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Team</h2>
            <p className="text-muted-foreground leading-relaxed">
              FixSense is built by a passionate team of engineers, designers, and property 
              management experts who understand the challenges of maintaining multiple properties. 
              We're committed to making appliance maintenance simpler, more affordable, and 
              stress-free for everyone.
            </p>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-4 py-8 border-t">
            <h2 className="text-2xl font-semibold">Ready to Get Started?</h2>
            <p className="text-muted-foreground">
              Join thousands of property managers who trust FixSense for their appliance diagnostics.
            </p>
            <Link 
              to="/auth" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
            >
              Get Started Free
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
