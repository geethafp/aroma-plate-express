import { ShoppingBag, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart-context';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="font-serif-display text-2xl tracking-tight text-foreground">
          Annapurna
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <User size={20} strokeWidth={1.5} />
            <span className="hidden sm:inline">Login</span>
          </Link>
          <Link to="/cart" className="relative flex items-center gap-2 text-sm font-medium text-foreground">
            <ShoppingBag size={20} strokeWidth={1.5} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
