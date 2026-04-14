import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, LogOut, Mail, MapPin, Package, Phone, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Footer from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

type SavedAddress = {
  id: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  updated_at: string;
};

type OrderRecord = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  delivery_date: string;
  delivery_time: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  order_items: {
    id: string;
    item_id: string;
    item_name: string;
    item_price: number;
    quantity: number;
  }[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount / 100);

const Account = () => {
  const { avatarUrl, displayName, isLoading, signOut, user } = useAuth();

  const accountInitials = useMemo(() => {
    if (!displayName) return 'A';

    return displayName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [displayName]);

  const addressesQuery = useQuery({
    enabled: !!user,
    queryKey: ['account-addresses', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('saved_addresses')
        .select('id, recipient_name, phone, address_line1, address_line2, city, state, pincode, updated_at')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as SavedAddress[];
    },
  });

  const ordersQuery = useQuery({
    enabled: !!user,
    queryKey: ['account-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, created_at, customer_name, customer_phone, address_line1, address_line2, city, state, pincode, delivery_date, delivery_time, total_amount, payment_status, payment_method, order_items(id, item_id, item_name, item_price, quantity)'
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as OrderRecord[];
    },
  });

  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-border/60">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {accountInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                  <UserRound size={14} />
                  My Account
                </div>
                <h1 className="font-serif-display text-4xl tracking-tight text-foreground">{displayName}</h1>
                {user?.email && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} />
                    {user.email}
                  </p>
                )}
                {user?.phone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    {user.phone}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => void signOut()} className="gap-2 self-start md:self-center">
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Saved Addresses</h2>
            </div>

            {addressesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading saved addresses...</p>
            ) : addressesQuery.error ? (
              <p className="text-sm text-rose-700">
                Saved addresses are not ready yet. Run the latest account migration in Supabase, then refresh this page.
              </p>
            ) : addressesQuery.data && addressesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {addressesQuery.data.map((address) => (
                  <article key={address.id} className="rounded-2xl bg-background/80 p-4">
                    <p className="font-medium text-foreground">{address.recipient_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {address.address_line1}
                      {address.address_line2 ? `, ${address.address_line2}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}
                      {address.state ? `, ${address.state}` : ''} {address.pincode}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Updated {format(new Date(address.updated_at), 'dd MMM yyyy, h:mm a')}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your delivery addresses will appear here after you place an order while signed in.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Previous Orders</h2>
            </div>

            {ordersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading order history...</p>
            ) : ordersQuery.error ? (
              <p className="text-sm text-rose-700">
                Order history for signed-in users is not ready yet. Run the latest account migration in Supabase, then refresh this page.
              </p>
            ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
              <div className="space-y-4">
                {ordersQuery.data.map((order) => (
                  <article key={order.id} className="rounded-2xl bg-background/80 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-medium text-foreground">Order #{order.id.slice(0, 8)}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock3 size={14} />
                          {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Delivery on {format(new Date(order.delivery_date), 'dd MMM yyyy')} at {order.delivery_time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.address_line1}
                          {order.address_line2 ? `, ${order.address_line2}` : ''}, {order.city} {order.pincode}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                          {order.payment_status.replace('_', ' ')}
                        </p>
                        <p className="mt-3 font-mono-price text-lg font-bold text-foreground">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-foreground">
                            {item.item_name} x {item.quantity}
                          </span>
                          <span className="font-mono-price text-muted-foreground">
                            {formatCurrency(item.item_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your signed-in order history will show up here after you place your next order.
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
