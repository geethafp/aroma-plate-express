import { motion } from 'framer-motion';
import heroBanner from '@/assets/hero-banner.jpg';

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="Heritage Indian catering spread" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      </div>
      <div className="container relative mx-auto flex min-h-[70vh] flex-col items-center justify-end px-4 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          className="font-serif-display text-5xl md:text-7xl tracking-tight text-foreground text-balance max-w-3xl"
        >
          Heritage Catering, Delivered.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.25 }}
          className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl"
        >
          South Indian mains & North Indian desserts, crafted for your celebrations.
        </motion.p>
        <motion.a
          href="#menu"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.4 }}
          className="mt-8 rounded-xl bg-primary px-8 py-3.5 text-base font-medium text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          Build Your Menu
        </motion.a>
      </div>
    </section>
  );
};

export default HeroSection;
