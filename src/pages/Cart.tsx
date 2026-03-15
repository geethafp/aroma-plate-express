import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import DeliveryScheduler from '@/components/DeliveryScheduler';
import { useCart } from '@/lib/cart-context';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'schedule' | 'address' | 'confirm'>('cart');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paying, setPaying] = useState(false);
  const [address, setAddress] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
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
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep('confirm');
  };

  const handlePayment = async () => {
    if (paying) return;
    setPaying(true);

    try {
      // 1. Create order in DB + Razorpay
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          address,
          deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : '',
          deliveryTime,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed to create order');

      const { orderId, razorpayOrderId, razorpayKeyId, amount, currency } = data;

      // 2. Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Annapurna Catering',
        description: `Order for ${items.length} item(s)`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            // 3. Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
              },
            });

            if (verifyError || verifyData?.error) {
              toast.error('Payment verification failed');
              setPaying(false);
              return;
            }

            // 4. Success — navigate to confirmation
            clearCart();
            navigate('/order-success', {
              state: {
                orderId,
                customerName: address.name,
                phone: address.phone,
                address: { line1: address.line1, line2: address.line2, city: address.city, state: address.state, pincode: address.pincode },
                deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : '',
                deliveryTime,
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalAmount: totalPrice,
                paymentId: response.razorpay_payment_id,
              },
            });
          } catch {
            toast.error('Something went wrong verifying payment');
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  const goBack = () => {
    if (step === 'cart') navigate('/');
    else if (step === 'schedule') setStep('cart');
    else if (step === 'address') setStep('schedule');
    else setStep('address');
  };

  const backLabel = step === 'cart' ? 'Back to menu' : step === 'schedule' ? 'Back to cart' : step === 'address' ? 'Back to schedule' : 'Back to address';

  const stepIndex = ['cart', 'schedule', 'address', 'confirm'].indexOf(step);

  if (items.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <p className="font-serif-display text-2xl text-foreground mb-2">Your feast is currently empty.</p>
          <p className="text-muted-foreground mb-6">Browse our menu and add dishes to get started.</p>
          <Link to="/" className="rounded-xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> {backLabel}
        </button>

        <div className="flex items-center gap-2 mb-8">
          {['Cart', 'Schedule', 'Address', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-primary' : 'bg-border'}`} />
              <span className={`text-xs font-medium ${i <= stepIndex ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-6">Your Order</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 rounded-2xl bg-card card-shadow p-3">
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover image-outline" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                      <p className="font-mono-price text-sm font-bold text-primary mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-muted-foreground hover:text-foreground"><Minus size={14} /></button>
                          <span className="font-mono-price text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-muted-foreground hover:text-foreground"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="font-mono-price text-sm font-bold text-foreground self-center">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-lg font-medium text-foreground">Total</span>
                <span className="font-mono-price text-xl font-bold text-primary">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <button onClick={() => setStep('schedule')} className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform">
                Schedule Delivery
              </button>
            </motion.div>
          )}

          {step === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-6">Schedule Delivery</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose a delivery slot at least 24 hours from now.</p>
              <DeliveryScheduler date={deliveryDate} time={deliveryTime} onDateChange={setDeliveryDate} onTimeChange={setDeliveryTime} />
              <button onClick={handleScheduleContinue} className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform">
                Continue to Address
              </button>
            </motion.div>
          )}

          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={20} className="text-primary" />
                <h2 className="font-serif-display text-3xl tracking-tight text-foreground">Delivery Address</h2>
              </div>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name *" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} className="h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                  <input type="tel" placeholder="Phone Number *" maxLength={10} value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))} className="h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
                <input type="text" placeholder="Address Line 1 *" value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} className="w-full h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                <input type="text" placeholder="Address Line 2 (Landmark)" value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} className="w-full h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" placeholder="City *" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className="h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                  <input type="text" placeholder="State *" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} className="h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                  <input type="text" placeholder="PIN Code *" maxLength={6} value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} className="h-12 rounded-xl bg-card card-shadow px-4 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
                <button type="submit" className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform">Review Order</button>
              </form>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={transition}>
              <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-6">Order Summary</h2>

              {deliveryDate && deliveryTime && (
                <div className="rounded-2xl bg-card card-shadow p-5 mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">DELIVERY SCHEDULE</h3>
                  <p className="text-foreground font-medium">{format(deliveryDate, 'EEEE, dd MMMM yyyy')}</p>
                  <p className="text-sm text-muted-foreground">Time: {deliveryTime}</p>
                </div>
              )}

              <div className="rounded-2xl bg-card card-shadow p-5 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">DELIVERY TO</h3>
                <p className="text-foreground font-medium">{address.name}</p>
                <p className="text-sm text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                <p className="text-sm text-muted-foreground">Phone: +91 {address.phone}</p>
              </div>

              <div className="rounded-2xl bg-card card-shadow p-5 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">ITEMS ({items.length})</h3>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between py-2">
                    <span className="text-foreground">{item.name} × {item.quantity}</span>
                    <span className="font-mono-price font-bold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-3 mt-3">
                  <span className="text-lg font-medium text-foreground">Total</span>
                  <span className="font-mono-price text-xl font-bold text-primary">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paying}
                className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${totalPrice.toLocaleString('en-IN')}`
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
