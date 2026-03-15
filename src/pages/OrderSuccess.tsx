import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Calendar, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

interface OrderData {
  orderId: string;
  customerName: string;
  phone: string;
  address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  deliveryDate: string;
  deliveryTime: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentId: string;
}

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state as OrderData | null;

  useEffect(() => {
    if (!orderData) navigate('/');
  }, [orderData, navigate]);

  if (!orderData) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="text-center mb-8"
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="font-serif-display text-3xl tracking-tight text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">Payment received successfully. Your feast is being prepared.</p>
          <p className="font-mono-price text-xs text-muted-foreground/60 mt-2">Payment ID: {orderData.paymentId}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="rounded-2xl bg-card card-shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">DELIVERY SCHEDULE</h3>
            </div>
            <p className="text-foreground font-medium">
              {format(new Date(orderData.deliveryDate), 'EEEE, dd MMMM yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">Time: {orderData.deliveryTime}</p>
          </div>

          <div className="rounded-2xl bg-card card-shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">DELIVERY TO</h3>
            </div>
            <p className="text-foreground font-medium">{orderData.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {orderData.address.line1}{orderData.address.line2 ? `, ${orderData.address.line2}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}
            </p>
            <p className="text-sm text-muted-foreground">Phone: +91 {orderData.phone}</p>
          </div>

          <div className="rounded-2xl bg-card card-shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">ORDER ITEMS</h3>
            </div>
            {orderData.items.map((item, i) => (
              <div key={i} className="flex justify-between py-2">
                <span className="text-foreground">{item.name} × {item.quantity}</span>
                <span className="font-mono-price font-bold text-foreground">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3 mt-3">
              <span className="text-lg font-medium text-foreground">Total Paid</span>
              <span className="font-mono-price text-xl font-bold text-primary">
                ₹{orderData.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground active:scale-[0.98] transition-transform"
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
