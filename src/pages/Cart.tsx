import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Banknote, CreditCard, Loader2, MapPin, Minus, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Header from '@/components/Header';
import DeliveryScheduler from '@/components/DeliveryScheduler';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/lib/cart-context';

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };

const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

const extractFunctionError = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    const context = (error as Error & { context?: unknown }).context;

    if (typeof context === 'string') {
      try {
        const parsed = JSON.parse(context) as { error?: string };
        if (parsed?.error) return parsed.error;
      } catch {
        if (context.trim()) return context;
      }
    }

    if (error.message) return error.message;
  }

  return fallback;
};

type PaymentMethod = 'online' | 'cod';

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'schedule' | 'address' | 'confirm'>('cart');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    pincode: '',
  });

  const handleScheduleContinue = () => {
    if (!deliveryDate || !deliveryTime) {
      toast.error('Please select both date and time');
      return;
    }

    setStep('address');
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    setStep('confirm');
  };

  const buildOrderSuccessState = (orderId: string, paymentId?: string | null) => ({
    orderId,
    customerName: address.name,
    phone: address.phone,
    address: {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      pincode: address.pincode,
    },
    deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : '',
    deliveryTime,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: totalPrice,
    paymentId,
    paymentMethod,
  });

  const sendWhatsAppConfirmation = async (orderId: string) => {
    try {
      await supabase.functions.invoke('send-order-whatsapp', {
        body: {
          phone: address.phone,
          customerName: address.name,
          orderId,
          totalAmount: totalPrice,
          deliveryDate: deliveryDate ? format(deliveryDate, 'dd MMM yyyy') : '',
          deliveryTime,
          paymentMethod,
          items: items.map((item) => ({ name: item.name, quantity: item.quantity })),
        },
      });
    } catch {
      // Non-critical: don't block navigation
      console.warn('WhatsApp confirmation failed');
    }
  };

  const handlePayment = async () => {
    if (paying) return;

    setPaying(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          address,
          deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : '',
          deliveryTime,
          paymentMethod,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || extractFunctionError(error, 'Failed to create order'));
      }

      if (paymentMethod === 'cod') {
        const codOrderId = data.orderId;
        clearCart();
        sendWhatsAppConfirmation(codOrderId);
        navigate('/order-success', {
          state: buildOrderSuccessState(codOrderId, null),
        });
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay checkout failed to load. Refresh the page and try again.');
      }

      const { orderId, razorpayOrderId, razorpayKeyId, amount, currency } = data;

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Annapurna Catering',
        description: `Order for ${items.length} item(s)`,
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
              },
            });

            if (verifyError || verifyData?.error) {
              toast.error(verifyData?.error || extractFunctionError(verifyError, 'Payment verification failed'));
              setPaying(false);
              return;
            }

            clearCart();
            navigate('/order-success', {
              state: {
                ...buildOrderSuccessState(response.razorpay_payment_id),
                orderId,
                paymentMethod: 'online',
              },
            });
          } catch (err: unknown) {
            toast.error(extractFunctionError(err, 'Something went wrong verifying payment'));
            setPaying(false);
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: { color: '#c2410c' },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err: unknown) {
      toast.error(extractFunctionError(err, 'Failed to initiate payment'));
      setPaying(false);
    }
  };

  const goBack = () => {
    if (step === 'cart') navigate('/');
    else if (step === 'schedule') setStep('cart');
    else if (step === 'address') setStep('schedule');
    else setStep('address');
  };

  const backLabel =
    step === 'cart'
      ? 'Back to menu'
      : step === 'schedule'
        ? 'Back to cart'
        : step === 'address'
          ? 'Back to schedule'
          : 'Back to address';

  const stepIndex = ['cart', 'schedule', 'address', 'confirm'].indexOf(step);

  if (items.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BreadcrumbTrail />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <p className="mb-2 font-serif-display text-2xl text-foreground">Your feast is currently empty.</p>
          <p className="mb-6 text-muted-foreground">Browse our menu and add dishes to get started.</p>
          <Link to="/" className="rounded-xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} /> {backLabel}
        </button>

        <div className="mb-8 flex items-center gap-2">
          {['Cart', 'Schedule', 'Address', 'Confirm'].map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className={`h-1 flex-1 rounded-full transition-colors ${index <= stepIndex ? 'bg-primary' : 'bg-border'}`} />
              <span className={`text-xs font-medium ${index <= stepIndex ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="mb-6 font-serif-display text-3xl tracking-tight text-foreground">Your Order</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-2xl bg-card p-3 card-shadow">
                    <img src={item.image} alt={item.name} className="image-outline h-20 w-20 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">{item.name}</h3>
                      <p className="mt-0.5 font-mono-price text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-muted-foreground hover:text-foreground">
                            <Minus size={14} />
                          </button>
                          <span className="w-4 text-center font-mono-price text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-muted-foreground hover:text-foreground">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="self-center font-mono-price text-sm font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-lg font-medium text-foreground">Total</span>
                <span className="font-mono-price text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <button onClick={() => setStep('schedule')} className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]">
                Schedule Delivery
              </button>
            </motion.div>
          )}

          {step === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="mb-6 font-serif-display text-3xl tracking-tight text-foreground">Schedule Delivery</h2>
              <p className="mb-6 text-sm text-muted-foreground">Choose a delivery slot at least 24 hours from now.</p>
              <DeliveryScheduler date={deliveryDate} time={deliveryTime} onDateChange={setDeliveryDate} onTimeChange={setDeliveryTime} />
              <button onClick={handleScheduleContinue} className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]">
                Continue to Address
              </button>
            </motion.div>
          )}

          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <div className="mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                <h2 className="font-serif-display text-3xl tracking-tight text-foreground">Delivery Address</h2>
              </div>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="Full Name *" value={address.name} onChange={(e) => setAddress((current) => ({ ...current, name: e.target.value }))} className="h-12 rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                  <input type="tel" placeholder="Phone Number *" maxLength={10} value={address.phone} onChange={(e) => setAddress((current) => ({ ...current, phone: e.target.value.replace(/\D/g, '') }))} className="h-12 rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                </div>
                <input type="text" placeholder="Address Line 1 *" value={address.line1} onChange={(e) => setAddress((current) => ({ ...current, line1: e.target.value }))} className="h-12 w-full rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                <input type="text" placeholder="Address Line 2 (Landmark)" value={address.line2} onChange={(e) => setAddress((current) => ({ ...current, line2: e.target.value }))} className="h-12 w-full rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="City *" value={address.city} onChange={(e) => setAddress((current) => ({ ...current, city: e.target.value }))} className="h-12 rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                  <input type="text" placeholder="PIN Code *" maxLength={6} value={address.pincode} onChange={(e) => setAddress((current) => ({ ...current, pincode: e.target.value.replace(/\D/g, '') }))} className="h-12 rounded-xl bg-card px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary card-shadow" />
                </div>
                <button type="submit" className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]">
                  Review Order
                </button>
              </form>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="mb-6 font-serif-display text-3xl tracking-tight text-foreground">Order Summary</h2>

              {deliveryDate && deliveryTime && (
                <div className="mb-4 rounded-2xl bg-card p-5 card-shadow">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">DELIVERY SCHEDULE</h3>
                  <p className="font-medium text-foreground">{format(deliveryDate, 'EEEE, dd MMMM yyyy')}</p>
                  <p className="text-sm text-muted-foreground">Time: {deliveryTime}</p>
                </div>
              )}

              <div className="mb-4 rounded-2xl bg-card p-5 card-shadow">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">DELIVERY TO</h3>
                <p className="font-medium text-foreground">{address.name}</p>
                <p className="text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city} - {address.pincode}
                </p>
                <p className="text-sm text-muted-foreground">Phone: +91 {address.phone}</p>
              </div>

              <div className="mb-4 rounded-2xl bg-card p-5 card-shadow">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">ITEMS ({items.length})</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <span className="text-foreground">{item.name} x {item.quantity}</span>
                    <span className="font-mono-price font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="text-lg font-medium text-foreground">Total</span>
                  <span className="font-mono-price text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-card p-5 card-shadow">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">CHOOSE PAYMENT MODE</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`rounded-2xl border p-4 text-left transition-colors ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <CreditCard size={18} className="text-primary" />
                      <span className="font-medium text-foreground">Pay Online</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Complete payment now using Razorpay.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`rounded-2xl border p-4 text-left transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Banknote size={18} className="text-primary" />
                      <span className="font-medium text-foreground">Cash on Delivery</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pay when your order is delivered.</p>
                  </button>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paying}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {paying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === 'online' ? (
                  `Pay ${formatCurrency(totalPrice)} Online`
                ) : (
                  `Confirm Cash on Delivery - ${formatCurrency(totalPrice)}`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Cart;
