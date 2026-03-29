CREATE POLICY "Authenticated insert menu_items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update menu_items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete menu_items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (true);
