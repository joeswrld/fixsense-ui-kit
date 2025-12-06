import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { FileText, Users, CreditCard, ShieldAlert, Copyright, AlertTriangle, Scale, Gavel, Mail } from "lucide-react";

const TermsOfService = () => {
  const sections = [
    {
      icon: FileText,
      title: "1. Acceptance of Terms",
      content: (
        <p>
          By accessing or using FixSense ("the Service"), you agree to be bound by these 
          Terms of Service. If you do not agree to these terms, please do not use the Service.
        </p>
      )
    },
    {
      icon: ShieldAlert,
      title: "2. Description of Service",
      content: (
        <p>
          FixSense is an AI-powered platform that provides appliance diagnostic services, 
          maintenance scheduling, and property management tools. Our service analyzes 
          uploaded media (photos, videos, audio) to diagnose appliance issues and provide 
          repair recommendations.
        </p>
      )
    },
    {
      icon: Users,
      title: "3. User Accounts",
      content: (
        <>
          <p className="mb-3">To use FixSense, you must:</p>
          <ul className="space-y-2 mb-4">
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account.
          </p>
        </>
      )
    },
    {
      icon: CreditCard,
      title: "4. Subscription Plans and Payments",
      content: (
        <>
          <div className="space-y-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Free Plan</h3>
              <p>Limited diagnostic features with monthly usage limits.</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Pro Plan</h3>
              <p>Enhanced features with increased usage limits and priority support.</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Business Plan</h3>
              <p>Full features including multi-property support and team access.</p>
            </div>
          </div>
          
          <p>
            Payments are processed securely through Paystack. Subscriptions renew automatically 
            unless cancelled before the renewal date. Refunds are handled on a case-by-case basis.
          </p>
        </>
      )
    },
    {
      icon: AlertTriangle,
      title: "5. Acceptable Use",
      content: (
        <>
          <p className="mb-3">You agree not to:</p>
          <ul className="space-y-2">
            <li>Upload malicious content or malware</li>
            <li>Attempt to circumvent usage limits or security measures</li>
            <li>Use the service for any illegal purpose</li>
            <li>Share your account credentials with others</li>
            <li>Reverse engineer or attempt to extract our AI models</li>
            <li>Upload content that infringes on intellectual property rights</li>
          </ul>
        </>
      )
    },
    {
      icon: Copyright,
      title: "6. Intellectual Property",
      content: (
        <p>
          The Service, including its AI models, software, and content, is owned by FixSense 
          and protected by intellectual property laws. You retain ownership of content you 
          upload but grant us a license to process it for providing the Service.
        </p>
      )
    },
    {
      icon: ShieldAlert,
      title: "7. Disclaimer of Warranties",
      content: (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="font-medium text-foreground">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee 
            that diagnostic results will be 100% accurate. Our AI-powered diagnoses are intended 
            as guidance and should not replace professional inspection when necessary.
          </p>
        </div>
      )
    },
    {
      icon: Scale,
      title: "8. Limitation of Liability",
      content: (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="font-medium text-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXSENSE SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS 
            OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF 
            DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </div>
      )
    }
  ];

  const additionalSections = [
    {
      title: "9. Indemnification",
      content: "You agree to indemnify and hold harmless FixSense and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms."
    },
    {
      title: "10. Termination",
      content: "We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Service will immediately cease."
    },
    {
      title: "11. Changes to Terms",
      content: "We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new Terms."
    },
    {
      title: "12. Governing Law",
      content: "These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions."
    },
    {
      title: "13. Dispute Resolution",
      content: "Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in Lagos, Nigeria, except where prohibited by law."
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
              <Gavel className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Terms of Service</h1>
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
            <h2 className="text-2xl font-bold mb-3 text-foreground">14. Contact Information</h2>
            <p className="text-base text-muted-foreground mb-4">
              For questions about these Terms, please contact us at:
            </p>
            <a 
              href="mailto:legal@fixsense.com" 
              className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
            >
              legal@fixsense.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;