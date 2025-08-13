-- Enforce monthly code redemption limit and update profile monthly count
-- Function: enforce monthly limit on 'earn' transactions per user (max 60 per month)
CREATE OR REPLACE FUNCTION public.enforce_monthly_code_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Only enforce for 'earn' transactions (code redemptions)
  IF NEW.type = 'earn' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.points_transactions
    WHERE user_id = NEW.user_id
      AND type = 'earn'
      AND created_at >= date_trunc('month', now());

    IF v_count >= 60 THEN
      RAISE EXCEPTION 'Monthly code redemption limit (60) reached' USING ERRCODE = '45000';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update existing function to compute redeemed_this_month as count of 'earn' TX this month
CREATE OR REPLACE FUNCTION public.update_points_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update points balance
  UPDATE public.profiles
  SET points_balance = GREATEST(0, COALESCE(points_balance, 0) + NEW.points),
      updated_at = now()
  WHERE id = NEW.user_id;

  -- Recompute redeemed_this_month as count of 'earn' transactions this month
  UPDATE public.profiles p
  SET redeemed_this_month = COALESCE((
      SELECT COUNT(*)::int
      FROM public.points_transactions t
      WHERE t.user_id = p.id
        AND t.type = 'earn'
        AND t.created_at >= date_trunc('month', now())
    ), 0),
    updated_at = now()
  WHERE p.id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Triggers: enforce limit before insert, then update profile after insert
DROP TRIGGER IF EXISTS trg_enforce_monthly_code_limit ON public.points_transactions;
CREATE TRIGGER trg_enforce_monthly_code_limit
BEFORE INSERT ON public.points_transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_monthly_code_limit();

DROP TRIGGER IF EXISTS trg_update_points_on_insert ON public.points_transactions;
CREATE TRIGGER trg_update_points_on_insert
AFTER INSERT ON public.points_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_points_on_insert();