import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Introduction</h2>
          <p>
            FixSense ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our 
            AI-powered appliance diagnostic platform.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Name and email address</li>
            <li>Phone number and country</li>
            <li>Payment information (processed securely via Paystack)</li>
            <li>Property and appliance information</li>
          </ul>

          <h3>Usage Information</h3>
          <p>We automatically collect certain information when you use our service:</p>
          <ul>
            <li>Diagnostic uploads (photos, videos, audio recordings)</li>
            <li>Device information and browser type</li>
            <li>IP address and location data</li>
            <li>Usage patterns and feature interactions</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and improve our diagnostic services</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Send maintenance reminders and notifications</li>
            <li>Analyze usage patterns to improve our AI models</li>
            <li>Communicate with you about updates and support</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>Service providers (payment processors, email services)</li>
            <li>Legal authorities when required by law</li>
            <li>Business partners with your consent</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including 
            encryption, secure servers, and regular security audits. However, no method of 
            transmission over the internet is 100% secure.
          </p>

          <h2>6. Your Rights (GDPR)</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Object:</strong> Object to processing of your personal data</li>
            <li><strong>Restrict:</strong> Request restriction of processing</li>
          </ul>
          <p>
            To exercise these rights, visit your Settings page or contact us at{" "}
            <a href="mailto:privacy@fixsense.com">privacy@fixsense.com</a>.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to 
            provide services. You can request deletion of your data at any time through your 
            account settings.
          </p>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use essential cookies to provide our service. We do not use tracking cookies 
            for advertising purposes. You can manage cookie preferences through your browser settings.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 18 years of age. We do not knowingly 
            collect personal information from children.
          </p>

          <h2>10. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:privacy@fixsense.com">privacy@fixsense.com</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
