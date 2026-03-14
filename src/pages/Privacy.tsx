import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-serif-display text-4xl tracking-tight text-foreground mb-6">Privacy Policy</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed text-sm">
          <p className="text-base">Last updated: March 2026</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">1. Information We Collect</h2>
          <p>We collect personal information you provide when placing orders, creating an account, or contacting us. This includes your name, phone number, email address, and delivery address.</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">2. How We Use Your Information</h2>
          <p>Your information is used to process and deliver orders, communicate about your orders, improve our services, and send promotional offers (with your consent).</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. Payment data is processed through secure, PCI-DSS compliant payment gateways.</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">4. Data Sharing</h2>
          <p>We do not sell your personal data. We may share information with delivery partners solely for order fulfilment, and with authorities when required by law.</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">5. Cookies</h2>
          <p>We use essential cookies to maintain your session and cart. Analytics cookies help us understand usage patterns. You may disable non-essential cookies in your browser settings.</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting us at hello@annapurnacatering.in.</p>

          <h2 className="font-serif-display text-xl text-foreground pt-2">7. Contact</h2>
          <p>For privacy-related queries, email us at hello@annapurnacatering.in or call +91 98765 43210.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
