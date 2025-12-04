import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using FixSense ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            FixSense is an AI-powered platform that provides appliance diagnostic services, 
            maintenance scheduling, and property management tools. Our service analyzes 
            uploaded media (photos, videos, audio) to diagnose appliance issues and provide 
            repair recommendations.
          </p>

          <h2>3. User Accounts</h2>
          <p>To use FixSense, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account.
          </p>

          <h2>4. Subscription Plans and Payments</h2>
          <h3>Free Plan</h3>
          <p>Limited diagnostic features with monthly usage limits.</p>
          
          <h3>Pro Plan</h3>
          <p>Enhanced features with increased usage limits and priority support.</p>
          
          <h3>Business Plan</h3>
          <p>Full features including multi-property support and team access.</p>
          
          <p>
            Payments are processed securely through Paystack. Subscriptions renew automatically 
            unless cancelled before the renewal date. Refunds are handled on a case-by-case basis.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Upload malicious content or malware</li>
            <li>Attempt to circumvent usage limits or security measures</li>
            <li>Use the service for any illegal purpose</li>
            <li>Share your account credentials with others</li>
            <li>Reverse engineer or attempt to extract our AI models</li>
            <li>Upload content that infringes on intellectual property rights</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its AI models, software, and content, is owned by FixSense 
            and protected by intellectual property laws. You retain ownership of content you 
            upload but grant us a license to process it for providing the Service.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee 
            that diagnostic results will be 100% accurate. Our AI-powered diagnoses are intended 
            as guidance and should not replace professional inspection when necessary.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXSENSE SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS 
            OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF 
            DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless FixSense and its officers, directors, 
            employees, and agents from any claims, damages, or expenses arising from your 
            use of the Service or violation of these Terms.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for violation of these Terms 
            or for any other reason at our discretion. Upon termination, your right to use 
            the Service will immediately cease.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of 
            material changes via email or through the Service. Continued use after changes 
            constitutes acceptance of the new Terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of 
            Nigeria, without regard to its conflict of law provisions.
          </p>

          <h2>13. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or the Service shall be resolved through 
            binding arbitration in Lagos, Nigeria, except where prohibited by law.
          </p>

          <h2>14. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at:{" "}
            <a href="mailto:legal@fixsense.com">legal@fixsense.com</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
