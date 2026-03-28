import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type PaymentStatus = 'all' | 'pending' | 'paid' | 'failed' | 'cod_pending';
type PaymentMethod = 'all' | 'online' | 'cod';

type OrderItem = {
  id: string;
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
};

type OrderRecord = {
  id: string;
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
  payment_status: Exclude<PaymentStatus, 'all'> | string;
  payment_method: Exclude<PaymentMethod, 'all'> | string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  order_items: OrderItem[];
};

type OrdersResponse = {
  error?: string;
  limit: number;
  orders: OrderRecord[];
  page: number;
  total: number;
  totalPages: number;
  user?: {
    email: string | null;
  };
};

const paymentStatuses: PaymentStatus[] = ['all', 'pending', 'paid', 'failed', 'cod_pending'];
const paymentMethods: PaymentMethod[] = ['all', 'online', 'cod'];

const paymentStatusClasses: Record<string, string> = {
  cod_pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-800',
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-slate-200 text-slate-800',
};

const paymentMethodClasses: Record<string, string> = {
  cod: 'bg-orange-100 text-orange-800',
  online: 'bg-sky-100 text-sky-800',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount / 100);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatDeliveryDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    dateStyle: 'medium',
  });

const Orders = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('all');
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setSessionLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [paymentStatus, paymentMethod]);

  useEffect(() => {
    if (!session) {
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
      setViewerEmail(null);
      return;
    }

    let cancelled = false;

    const fetchOrders = async () => {
      setFetching(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke<OrdersResponse>('list-orders', {
        body: {
          limit: 10,
          page,
          paymentMethod,
          paymentStatus,
          search,
        },
      });

      if (cancelled) return;

      if (invokeError || data?.error) {
        setError(data?.error ?? invokeError?.message ?? 'Failed to fetch orders');
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
        setFetching(false);
        return;
      }

      setOrders(data?.orders ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      setViewerEmail(data?.user?.email ?? session.user.email ?? null);
      setFetching(false);
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [page, paymentMethod, paymentStatus, search, session]);

  const headline = useMemo(() => {
    if (fetching) return 'Refreshing orders...';
    if (total === 0) return 'No matching orders';
    return `${total} order${total === 1 ? '' : 's'} received`;
  }, [fetching, total]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/orders`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                <ShieldCheck size={14} />
                Orders Dashboard
              </div>
              <h1 className="font-serif-display text-4xl tracking-tight text-foreground">Received Orders</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Search customer orders, inspect payment status, and review delivery details without leaving the storefront app.
              </p>
            </div>

            {session && (
              <div className="flex flex-col items-start gap-3 rounded-2xl bg-background/80 p-4 text-sm md:items-end">
                <div className="text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{viewerEmail ?? session.user.email ?? 'Admin user'}</span>
                </div>
                <Button variant="outline" onClick={signOut} className="gap-2">
                  <LogOut size={16} />
                  Sign out
                </Button>
              </div>
            )}
          </div>

          {!sessionLoading && !session && (
            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-6">
              <h2 className="text-lg font-semibold text-foreground">Sign in to view orders</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                The dashboard fetches orders through a protected Supabase edge function, so you need an authenticated session before records can be loaded.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={signInWithGoogle}>Continue with Google</Button>
                <Button asChild variant="outline">
                  <Link to="/login">Open login page</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {sessionLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Checking your session...
          </div>
        ) : session ? (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{headline}</p>
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  </div>
                  <Button variant="outline" onClick={() => setPage(1)} disabled={fetching} className="gap-2">
                    <RefreshCcw size={16} className={fetching ? 'animate-spin' : ''} />
                    Refresh
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      className="pl-9"
                      placeholder="Search by customer, phone, city, or order ID"
                    />
                  </label>

                  <select
                    value={paymentStatus}
                    onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>
                        Payment: {status === 'all' ? 'all' : status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>

                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        Method: {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {error}
              </div>
            )}

            <section className="space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">{order.customer_name}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${paymentStatusClasses[order.payment_status] ?? 'bg-slate-100 text-slate-700'}`}>
                          {order.payment_status.replace('_', ' ')}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${paymentMethodClasses[order.payment_method] ?? 'bg-slate-100 text-slate-700'}`}>
                          {order.payment_method}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Order ID <span className="font-mono text-foreground">{order.id}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Received {formatDateTime(order.created_at)}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-sm text-muted-foreground">Order total</p>
                      <p className="font-mono-price text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{order.customer_phone}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{order.address_line1}</p>
                      {order.address_line2 && <p className="text-sm text-muted-foreground">{order.address_line2}</p>}
                      <p className="text-sm text-muted-foreground">
                        {order.city}{order.state ? `, ${order.state}` : ''} {order.pincode}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Delivery</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatDeliveryDate(order.delivery_date)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{order.delivery_time}</p>
                      {order.razorpay_payment_id && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Payment ID <span className="font-mono text-foreground">{order.razorpay_payment_id}</span>
                        </p>
                      )}
                      {order.razorpay_order_id && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Razorpay order <span className="font-mono text-foreground">{order.razorpay_order_id}</span>
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Items</p>
                      <div className="mt-2 space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                            </div>
                            <span className="whitespace-nowrap font-mono-price text-foreground">
                              {formatCurrency(item.item_price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.order_items.length === 0 && (
                          <p className="text-sm text-muted-foreground">No line items recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!fetching && orders.length === 0 && !error && (
                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  No orders matched the current filters.
                </div>
              )}
            </section>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || fetching}>
                    Previous
                  </Button>
                  <Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || fetching}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Orders;
