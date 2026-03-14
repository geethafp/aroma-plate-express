import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MenuSection from '@/components/MenuSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <MenuSection />
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p className="font-serif-display text-lg text-foreground mb-1">Annapurna Catering</p>
        <p>Heritage flavours, delivered with care.</p>
      </footer>
    </div>
  );
};

export default Index;
