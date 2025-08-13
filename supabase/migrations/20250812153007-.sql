-- Fix Product Images RLS Policy: Add public SELECT policy for product images
-- This allows customers to view product images for active products

CREATE POLICY "Public can view product images for active products" 
ON public.product_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.active = true
  )
);

-- Add index for better performance on product_images.product_id lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
ON public.product_images(product_id);

-- Add comprehensive input validation trigger for points_transactions
-- This prevents negative point amounts and validates transaction types
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
  
  IF NEW.points > 0 AND NEW.type = 'spend' THEN
    RAISE EXCEPTION 'Spend transactions cannot have positive points' USING ERRCODE = '23514';
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

-- Create trigger for points transaction validation
DROP TRIGGER IF EXISTS validate_points_transaction_trigger ON public.points_transactions;
CREATE TRIGGER validate_points_transaction_trigger
  BEFORE INSERT OR UPDATE ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_points_transaction();

-- Add validation function for reward codes to prevent code injection
CREATE OR REPLACE FUNCTION public.validate_reward_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate code format (alphanumeric only, reasonable length)
  IF NEW.code !~ '^[A-Za-z0-9]{3,20}$' THEN
    RAISE EXCEPTION 'Invalid reward code format' USING ERRCODE = '23514';
  END IF;

  -- Normalize code to uppercase
  NEW.code = UPPER(NEW.code);

  RETURN NEW;
END;
$function$;

-- Create trigger for reward code validation
DROP TRIGGER IF EXISTS validate_reward_code_trigger ON public.redeemed_codes;
CREATE TRIGGER validate_reward_code_trigger
  BEFORE INSERT ON public.redeemed_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_reward_code();