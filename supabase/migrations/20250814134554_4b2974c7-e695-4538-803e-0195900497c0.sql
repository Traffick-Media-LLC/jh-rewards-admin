-- Fix the search path security warning for the reconcile function
CREATE OR REPLACE FUNCTION public.reconcile_points_balance(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(user_id UUID, old_balance INTEGER, new_balance INTEGER, difference INTEGER) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;