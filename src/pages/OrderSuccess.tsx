import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, CreditCard, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

interface OrderData {
  orderId: string;
  customerName: string;
  phone: string;
  address: { line1: string; line2?: string; city: string; pincode: string };
  deliveryDate: string;
  deliveryTime: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentId?: string | null;
  paymentMethod: 'online' | 'cod';
}

const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state as OrderData | null;

  useEffect(() => {
    if (!orderData) navigate('/');
  }, [orderData, navigate]);

  if (!orderData) return null;

  const isCod = orderData.paymentMethod === 'cod';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreadcrumbTrail />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="mb-8 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="mb-2 font-serif-display text-3xl tracking-tight text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            {isCod
              ? 'Your order is booked. Please keep the amount ready for cash on delivery.'
              : 'Payment received successfully. Your feast is being prepared.'}
          </p>
          {orderData.paymentId && (
            <p className="mt-2 font-mono-price text-xs text-muted-foreground/60">Payment ID: {orderData.paymentId}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="rounded-2xl bg-card p-5 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">PAYMENT MODE</h3>
            </div>
            <p className="font-medium text-foreground">{isCod ? 'Cash on Delivery' : 'Online Payment'}</p>
            <p className="text-sm text-muted-foreground">
              {isCod ? 'Payment will be collected at delivery.' : 'Your online payment has been recorded.'}
            </p>
          </div>

          <div className="rounded-2xl bg-card p-5 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">DELIVERY SCHEDULE</h3>
            </div>
            <p className="font-medium text-foreground">{format(new Date(orderData.deliveryDate), 'EEEE, dd MMMM yyyy')}</p>
            <p className="text-sm text-muted-foreground">Time: {orderData.deliveryTime}</p>
          </div>

          <div className="rounded-2xl bg-card p-5 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">DELIVERY TO</h3>
            </div>
            <p className="font-medium text-foreground">{orderData.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {orderData.address.line1}
              {orderData.address.line2 ? `, ${orderData.address.line2}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {orderData.address.city} - {orderData.address.pincode}
            </p>
            <p className="text-sm text-muted-foreground">Phone: +91 {orderData.phone}</p>
          </div>

          <div className="rounded-2xl bg-card p-5 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">ORDER ITEMS</h3>
            </div>
            {orderData.items.map((item, index) => (
              <div key={index} className="flex justify-between py-2">
                <span className="text-foreground">
                  {item.name} x {item.quantity}
                </span>
                <span className="font-mono-price font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="text-lg font-medium text-foreground">{isCod ? 'Total Due' : 'Total Paid'}</span>
              <span className="font-mono-price text-xl font-bold text-primary">{formatCurrency(orderData.totalAmount)}</span>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Back to Menu
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
