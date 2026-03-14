import { useState } from 'react';
import { motion } from 'framer-motion';
import DishCard from './DishCard';
import { menuItems } from '@/lib/menu-data';

const categories = [
  { key: 'all', label: 'All Dishes' },
  { key: 'south-indian', label: 'South Indian' },
  { key: 'mains', label: 'Mains' },
  { key: 'north-indian-desserts', label: 'Desserts' },
] as const;

const MenuSection = () => {
  const [active, setActive] = useState<string>('all');

  const filtered = active === 'all' ? menuItems : menuItems.filter(i => i.category === active);

  return (
    <section id="menu" className="container mx-auto px-4 py-16">
      <h2 className="font-serif-display text-4xl md:text-5xl tracking-tight text-foreground text-center mb-3">
        Regional Curations
      </h2>
      <p className="text-center text-muted-foreground mb-10">
        Every dish prepared fresh, designed to serve 10–12 guests.
      </p>

      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActive(cat.key)}
            className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              active === cat.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {active === cat.key && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((item, i) => (
          <DishCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
