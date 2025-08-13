
-- Create triggers needed to keep profiles in sync with points transactions

-- 1) Keep profiles.updated_at current on every update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_set_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- 2) After inserting a points transaction, update the user's points balance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_points_transactions_after_insert'
  ) THEN
    CREATE TRIGGER trg_points_transactions_after_insert
      AFTER INSERT ON public.points_transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_points_on_insert();
  END IF;
END
$$;

-- 3) Helpful index for fetching a user's recent transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_created_at
  ON public.points_transactions (user_id, created_at);
