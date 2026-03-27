ALTER TABLE public.orders
ADD COLUMN payment_method text NOT NULL DEFAULT 'online'
CHECK (payment_method IN ('online', 'cod'));
