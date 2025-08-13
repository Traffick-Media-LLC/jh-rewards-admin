-- Fix products admin policies and add remaining admin policies

-- Products admin manage policies (separate per command)
DROP POLICY IF EXISTS "Admins can manage products INSERT" ON public.products;
CREATE POLICY "Admins can manage products INSERT"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "Admins can manage products UPDATE" ON public.products;
CREATE POLICY "Admins can manage products UPDATE"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "Admins can manage products DELETE" ON public.products;
CREATE POLICY "Admins can manage products DELETE"
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role('admin'));

-- Profiles: admins can view and update all
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Orders: admins can view and update all
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Points transactions: admins can view all and insert adjustments for any user
DROP POLICY IF EXISTS "Admins can view all point transactions" ON public.points_transactions;
CREATE POLICY "Admins can view all point transactions"
ON public.points_transactions
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Admins can insert point transactions for any user" ON public.points_transactions;
CREATE POLICY "Admins can insert point transactions for any user"
ON public.points_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));
