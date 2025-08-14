-- Fix validate_points_transaction function to use correct enum values
CREATE OR REPLACE FUNCTION public.validate_points_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate points amount
  IF NEW.points < 0 AND NEW.type = 'earn' THEN
    RAISE EXCEPTION 'Earn transactions cannot have negative points' USING ERRCODE = '23514';
  END IF;
  
  IF NEW.points > 0 AND NEW.type = 'redeem' THEN
    RAISE EXCEPTION 'Redeem transactions cannot have positive points' USING ERRCODE = '23514';
  END IF;

  -- Validate transaction amount limits
  IF ABS(NEW.points) > 50000 THEN
    RAISE EXCEPTION 'Transaction amount exceeds maximum limit' USING ERRCODE = '23514';
  END IF;

  -- Validate description length
  IF LENGTH(NEW.description) > 500 THEN
    RAISE EXCEPTION 'Transaction description too long' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;