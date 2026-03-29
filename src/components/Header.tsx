import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Header = () => {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="font-serif-display text-2xl tracking-tight text-foreground">
          Annapurna
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Orders
          </Link>
          {session && (
            <Link to="/menu-admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Menu Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <User size={20} strokeWidth={1.5} />
            <span className="hidden sm:inline">{session ? 'Account' : 'Login'}</span>
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
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden text-foreground">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-t border-border/50 overflow-hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
              <Link to="/orders" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Orders
              </Link>
              {session && (
                <Link to="/menu-admin" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Menu Admin
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
