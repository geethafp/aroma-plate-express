import { useState } from 'react';
import { motion } from 'framer-motion';
import DishCard from './DishCard';
import type { MenuItem } from '@/lib/cart-context';
import { fallbackMenuItems } from '@/lib/menu-data';

const categories = [
  { key: 'all', label: 'All Dishes' },
  { key: 'south-indian', label: 'South Indian' },
  { key: 'mains', label: 'Mains' },
  { key: 'north-indian-desserts', label: 'Desserts' },
] as const;

const MenuSection = () => {
  const [active, setActive] = useState<string>('all');
  const menuItems: MenuItem[] = fallbackMenuItems;

  const filtered = active === 'all' ? menuItems : menuItems.filter((item) => item.category === active);

  return (
    <section id="menu" className="container mx-auto px-4 py-16">
      <h2 className="mb-3 text-center font-serif-display text-4xl tracking-tight text-foreground md:text-5xl">
        Regional Curations
      </h2>
      <p className="mb-10 text-center text-muted-foreground">
        Every dish prepared fresh, designed to serve 10-12 guests.
      </p>

      {loading && <p className="mb-6 text-center text-sm text-muted-foreground">Loading menu...</p>}

      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => setActive(category.key)}
            className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              active === category.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {active === category.key && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              />
            )}
            <span className="relative z-10">{category.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, index) => (
          <DishCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
