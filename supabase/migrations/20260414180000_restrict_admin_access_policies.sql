DROP POLICY IF EXISTS "Service role select orders" ON public.orders;
DROP POLICY IF EXISTS "Service role update orders" ON public.orders;
DROP POLICY IF EXISTS "Service role select order_items" ON public.order_items;

DROP POLICY IF EXISTS "Authenticated insert menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated update menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated delete menu_items" ON public.menu_items;

CREATE POLICY "Admin select orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);

CREATE POLICY "Admin update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
)
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);

CREATE POLICY "Admin select order_items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);

CREATE POLICY "Admin insert menu_items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);

CREATE POLICY "Admin update menu_items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
)
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);

CREATE POLICY "Admin delete menu_items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN ('gfp.vja@gmail.com', 'vamseekonkinmalla@gmail.com')
);
