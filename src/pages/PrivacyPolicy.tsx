import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Eye, UserCheck, Database, Globe, FileText, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Shield,
      title: "1. Introduction",
      content: (
        <p>
          FixSense ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
          explains how we collect, use, disclose, and safeguard your information when you use our 
          AI-powered appliance diagnostic platform.
        </p>
      )
    },
    {
      icon: Database,
      title: "2. Information We Collect",
      content: (
        <>
          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Personal Information</h3>
          <p className="mb-3">We collect information you provide directly to us, including:</p>
          <ul className="space-y-2 mb-4">
            <li>Name and email address</li>
            <li>Phone number and country</li>
            <li>Payment information (processed securely via Paystack)</li>
            <li>Property and appliance information</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Usage Information</h3>
          <p className="mb-3">We automatically collect certain information when you use our service:</p>
          <ul className="space-y-2">
            <li>Diagnostic uploads (photos, videos, audio recordings)</li>
            <li>Device information and browser type</li>
            <li>IP address and location data</li>
            <li>Usage patterns and feature interactions</li>
          </ul>
        </>
      )
    },
    {
      icon: Eye,
      title: "3. How We Use Your Information",
      content: (
        <>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="space-y-2">
            <li>Provide and improve our diagnostic services</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Send maintenance reminders and notifications</li>
            <li>Analyze usage patterns to improve our AI models</li>
            <li>Communicate with you about updates and support</li>
            <li>Comply with legal obligations</li>
          </ul>
        </>
      )
    },
    {
      icon: Globe,
      title: "4. Data Sharing and Disclosure",
      content: (
        <>
          <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
          <ul className="space-y-2">
            <li>Service providers (payment processors, email services)</li>
            <li>Legal authorities when required by law</li>
            <li>Business partners with your consent</li>
          </ul>
        </>
      )
    },
    {
      icon: Lock,
      title: "5. Data Security",
      content: (
        <p>
          We implement industry-standard security measures to protect your data, including 
          encryption, secure servers, and regular security audits. However, no method of 
          transmission over the internet is 100% secure.
        </p>
      )
    },
    {
      icon: UserCheck,
      title: "6. Your Rights (GDPR)",
      content: (
        <>
          <p className="mb-3">Under GDPR, you have the right to:</p>
          <ul className="space-y-2 mb-4">
            <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
            <li><strong className="text-foreground">Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong className="text-foreground">Erasure:</strong> Request deletion of your personal data</li>
            <li><strong className="text-foreground">Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong className="text-foreground">Object:</strong> Object to processing of your personal data</li>
            <li><strong className="text-foreground">Restrict:</strong> Request restriction of processing</li>
          </ul>
          <p>
            To exercise these rights, visit your Settings page or contact us at{" "}
            <a href="mailto:privacy@fixsense.com" className="text-primary hover:underline font-medium">
              privacy@fixsense.com
            </a>.
          </p>
        </>
      )
    },
    {
      icon: FileText,
      title: "7. Data Retention",
      content: (
        <p>
          We retain your personal data for as long as your account is active or as needed to 
          provide services. You can request deletion of your data at any time through your 
          account settings.
        </p>
      )
    }
  ];

  const additionalSections = [
    {
      title: "8. Cookies and Tracking",
      content: "We use essential cookies to provide our service. We do not use tracking cookies for advertising purposes. You can manage cookie preferences through your browser settings."
    },
    {
      title: "9. Children's Privacy",
      content: "Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children."
    },
    {
      title: "10. International Transfers",
      content: "Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers."
    },
    {
      title: "11. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last updated\" date."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Main Sections with Icons */}
          <div className="space-y-8 mb-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4 text-foreground">{section.title}</h2>
                      <div className="text-base leading-relaxed text-muted-foreground">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Sections */}
          <div className="space-y-6 mb-12">
            {additionalSections.map((section, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold mb-3 text-foreground">{section.title}</h2>
                <p className="text-base leading-relaxed text-muted-foreground">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">12. Contact Us</h2>
            <p className="text-base text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <a 
              href="mailto:privacy@fixsense.com" 
              className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
            >
              privacy@fixsense.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;