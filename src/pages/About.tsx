import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-serif-display text-4xl tracking-tight text-foreground mb-6">About Annapurna</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Annapurna Catering was born from a simple belief — that every celebration deserves food that tells a story. Named after the Hindu goddess of nourishment, we bring the rich, diverse flavours of India to your doorstep.
          </p>
          <p>
            Our chefs draw from generations of culinary tradition, blending the aromatic spices of South Indian kitchens with the royal recipes of North Indian courts. From crisp masala dosas to melt-in-your-mouth gulab jamun, every dish is prepared with the finest ingredients and utmost care.
          </p>
          <h2 className="font-serif-display text-2xl text-foreground pt-4">Our Promise</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Fresh, handcrafted dishes prepared on the day of delivery</li>
            <li>Authentic recipes passed down through generations</li>
            <li>Premium ingredients sourced from trusted suppliers</li>
            <li>Hygienic preparation in FSSAI-certified kitchens</li>
            <li>On-time delivery for events of all sizes</li>
          </ul>
          <h2 className="font-serif-display text-2xl text-foreground pt-4">Catering for Every Occasion</h2>
          <p>
            Whether it's a family gathering of 20 or a grand wedding of 2000, we scale our kitchen to your needs. Corporate events, housewarming ceremonies, birthday parties, festive celebrations — Annapurna has been the trusted choice for thousands of happy customers.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
