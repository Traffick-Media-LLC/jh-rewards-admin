-- 1) Types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'points_tx_type') THEN
    CREATE TYPE public.points_tx_type AS ENUM ('earn', 'redeem', 'adjustment');
  END IF;
END $$;

-- 2) Utility function: update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  phone text,
  street text,
  city text,
  state text,
  postal_code text,
  country text,
  marketing_emails boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  product_preferences text[] NOT NULL DEFAULT ARRAY[]::text[],
  points_balance integer NOT NULL DEFAULT 0,
  redeemed_this_month integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (NEW.id,
          NEW.raw_user_meta_data ->> 'first_name',
          NEW.raw_user_meta_data ->> 'last_name',
          NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4) Points transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.points_tx_type NOT NULL,
  points integer NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for points_transactions
DROP POLICY IF EXISTS "Users can view their own point transactions" ON public.points_transactions;
CREATE POLICY "Users can view their own point transactions"
ON public.points_transactions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own point transactions" ON public.points_transactions;
CREATE POLICY "Users can insert their own point transactions"
ON public.points_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Maintain points balance and redeemed_this_month on insert
CREATE OR REPLACE FUNCTION public.update_points_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update points balance
  UPDATE public.profiles
  SET points_balance = GREATEST(0, COALESCE(points_balance, 0) + NEW.points),
      updated_at = now()
  WHERE id = NEW.user_id;

  -- Recompute redeemed_this_month (sum of negative points this month)
  UPDATE public.profiles p
  SET redeemed_this_month = COALESCE((
      SELECT SUM(ABS(t.points))
      FROM public.points_transactions t
      WHERE t.user_id = p.id
        AND t.points < 0
        AND t.created_at >= date_trunc('month', now())
    ), 0),
    updated_at = now()
  WHERE p.id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_points_insert ON public.points_transactions;
CREATE TRIGGER trg_points_insert
AFTER INSERT ON public.points_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_points_on_insert();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_date ON public.points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5) Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing',
  total_points integer NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_name text,
  shipping_phone text,
  shipping_street text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_date ON public.orders(user_id, created_at DESC);