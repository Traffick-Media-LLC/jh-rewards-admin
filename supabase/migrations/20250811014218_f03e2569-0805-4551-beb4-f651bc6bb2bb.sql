-- Create missing triggers safely if they do not exist

-- 1) Trigger: create profile row after new auth user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 2) Trigger: auto-update updated_at on profiles before update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- 3) Trigger: update points balance and monthly redeemed after inserting a points transaction
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_points_on_insert_trigger'
  ) THEN
    CREATE TRIGGER update_points_on_insert_trigger
    AFTER INSERT ON public.points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_points_on_insert();
  END IF;
END
$$;