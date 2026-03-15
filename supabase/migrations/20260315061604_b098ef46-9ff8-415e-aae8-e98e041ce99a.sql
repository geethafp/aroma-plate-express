
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  delivery_date date NOT NULL,
  delivery_time text NOT NULL,
  total_amount integer NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Service role update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Service role select order_items" ON public.order_items FOR SELECT USING (true);
