import { ShoppingBag, User, Menu, X, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Header = () => {
  const { totalItems } = useCart();
  const { avatarUrl, displayName, isLoading, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

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
        </nav>
        <div className="flex items-center gap-4">
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                  <Avatar className="h-9 w-9 border border-border/60">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary">{initials || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">My Account</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate">{displayName}</p>
                  {user.email && <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut size={14} />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <User size={20} strokeWidth={1.5} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
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
              {user ? (
                <Link to="/account" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  My Account
                </Link>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Login
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
