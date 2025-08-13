-- Add sale_price_cents column to products table
ALTER TABLE public.products 
ADD COLUMN sale_price_cents integer;