import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          <p className="font-serif-display text-xl text-foreground">Annapurna Catering</p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          </nav>
          <p className="text-xs text-muted-foreground">Heritage flavours, delivered with care.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
