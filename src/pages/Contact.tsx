import { useState } from 'react';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you! We will get back to you shortly.');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-serif-display text-4xl tracking-tight text-foreground mb-10">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Have questions about our catering services? We'd love to hear from you. Reach out and our team will respond within 24 hours.
            </p>
            <div className="space-y-4">
              {[
                { icon: Phone, label: '+91 98765 43210' },
                { icon: Mail, label: 'hello@annapurnacatering.in' },
                { icon: MapPin, label: 'No. 42, MG Road, Bengaluru, Karnataka 560001' },
                { icon: Clock, label: 'Mon – Sat, 9:00 AM – 8:00 PM' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={18} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text" placeholder="Your Name" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <input
              type="email" placeholder="Email Address" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <input
              type="tel" placeholder="Phone Number" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              className="w-full h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <textarea
              placeholder="Your Message" required rows={4} value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full rounded-xl bg-card card-shadow px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            />
            <button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform">
              Send Message
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
