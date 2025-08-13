-- Add Shopify order name and number to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shopify_order_name text,
  ADD COLUMN IF NOT EXISTS shopify_order_number integer;