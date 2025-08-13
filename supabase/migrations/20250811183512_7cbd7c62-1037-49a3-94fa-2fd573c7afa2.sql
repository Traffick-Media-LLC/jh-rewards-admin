-- Add homepage field to products table
ALTER TABLE public.products 
ADD COLUMN homepage boolean NOT NULL DEFAULT false;