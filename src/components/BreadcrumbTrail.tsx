import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const labelMap: Record<string, string> = {
  account: 'My Account',
  about: 'About',
  cart: 'Cart',
  contact: 'Contact',
  login: 'Login',
  'order-success': 'Order Confirmed',
  privacy: 'Privacy Policy',
};

const BreadcrumbTrail = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join('/')}`,
    label: labelMap[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    isCurrent: index === segments.length - 1,
  }));

  return (
    <div className="border-b border-border/50 bg-secondary/20">
      <div className="container mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb) => (
              <BreadcrumbItem key={crumb.href}>
                <BreadcrumbSeparator />
                {crumb.isCurrent ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default BreadcrumbTrail;
