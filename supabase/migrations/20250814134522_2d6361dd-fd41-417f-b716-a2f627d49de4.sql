-- Fix the duplicate triggers issue by dropping all duplicate triggers and keeping only one
-- First, drop all the duplicate triggers
DROP TRIGGER IF EXISTS trg_points_insert ON public.points_transactions;
DROP TRIGGER IF EXISTS trg_points_transactions_after_insert ON public.points_transactions;
DROP TRIGGER IF EXISTS trg_update_points_on_insert ON public.points_transactions;
DROP TRIGGER IF EXISTS update_points_on_insert_trigger ON public.points_transactions;

-- Create a single, properly named trigger
CREATE TRIGGER points_balance_update_trigger
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_points_on_insert();

-- Fix the user's points balance by recalculating from transaction history
UPDATE public.profiles 
SET points_balance = (
  SELECT COALESCE(SUM(points), 0) 
  FROM public.points_transactions 
  WHERE user_id = profiles.id
),
updated_at = now()
WHERE id = '20495f92-2148-4ba3-9ef0-9cfa2de120eb';

-- Add a points balance reconciliation function for future use
CREATE OR REPLACE FUNCTION public.reconcile_points_balance(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(user_id UUID, old_balance INTEGER, new_balance INTEGER, difference INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH balance_calculation AS (
    SELECT 
      p.id,
      p.points_balance as old_balance,
      COALESCE(SUM(pt.points), 0) as calculated_balance
    FROM public.profiles p
    LEFT JOIN public.points_transactions pt ON pt.user_id = p.id
    WHERE (target_user_id IS NULL OR p.id = target_user_id)
    GROUP BY p.id, p.points_balance
  ),
  updated_profiles AS (
    UPDATE public.profiles
    SET points_balance = bc.calculated_balance,
        updated_at = now()
    FROM balance_calculation bc
    WHERE profiles.id = bc.id 
      AND profiles.points_balance != bc.calculated_balance
    RETURNING profiles.id, bc.old_balance, profiles.points_balance as new_balance
  )
  SELECT 
    up.id::UUID,
    up.old_balance::INTEGER,
    up.new_balance::INTEGER,
    (up.new_balance - up.old_balance)::INTEGER as difference
  FROM updated_profiles up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;