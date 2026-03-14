import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import type { MenuItem } from '@/lib/cart-context';
import { useCart } from '@/lib/cart-context';

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };

interface DishCardProps {
  item: MenuItem;
  index: number;
}

const DishCard = ({ item, index }: DishCardProps) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...transition, delay: index * 0.06 }}
      className="group rounded-2xl bg-card card-shadow hover:card-shadow-hover transition-shadow duration-300"
    >
      <div className="p-1.5">
        <div className="aspect-[4/5] overflow-hidden rounded-xl image-outline">
          <motion.img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.03 }}
            transition={transition}
            loading="lazy"
          />
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 space-y-2">
        <h3 className="font-sans-ui text-lg font-medium text-foreground leading-tight">{item.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.serves}</span>
          <span>Prep: {item.prepTime}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono-price text-base font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</span>
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add"
                layoutId={`cart-btn-${item.id}`}
                onClick={() => addItem(item)}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground active:scale-95 transition-transform"
                whileTap={{ scale: 0.96 }}
                transition={transition}
              >
                Add
              </motion.button>
            ) : (
              <motion.div
                key="qty"
                layoutId={`cart-btn-${item.id}`}
                className="flex items-center gap-3 rounded-xl bg-primary px-2 py-1"
                transition={transition}
              >
                <button onClick={() => updateQuantity(item.id, quantity - 1)} className="p-1 text-primary-foreground">
                  <Minus size={16} strokeWidth={2} />
                </button>
                <span className="font-mono-price text-sm font-bold text-primary-foreground w-4 text-center">{quantity}</span>
                <button onClick={() => updateQuantity(item.id, quantity + 1)} className="p-1 text-primary-foreground">
                  <Plus size={16} strokeWidth={2} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default DishCard;
