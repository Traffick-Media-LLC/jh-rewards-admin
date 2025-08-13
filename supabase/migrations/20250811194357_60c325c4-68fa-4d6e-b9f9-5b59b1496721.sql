-- Add variant support to products table
ALTER TABLE public.products 
ADD COLUMN has_variants boolean NOT NULL DEFAULT false,
ADD COLUMN variant_types text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Create variant_options table for storing available options per variant type
CREATE TABLE public.variant_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  variant_type text NOT NULL,
  option_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_type, option_name)
);

-- Create product_variants table for storing specific variant combinations
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  variant_combination jsonb NOT NULL DEFAULT '{}'::jsonb,
  sku_suffix text,
  price_adjustment_cents integer NOT NULL DEFAULT 0,
  inventory integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for variant_options
CREATE POLICY "Admins can manage variant options" 
ON public.variant_options 
FOR ALL 
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Public can view variant options for active products" 
ON public.variant_options 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = variant_options.product_id 
  AND products.active = true
));

-- RLS policies for product_variants  
CREATE POLICY "Admins can manage product variants" 
ON public.product_variants 
FOR ALL 
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Public can view active product variants" 
ON public.product_variants 
FOR SELECT 
USING (active = true AND EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = product_variants.product_id 
  AND products.active = true
));

-- Add foreign key constraints
ALTER TABLE public.variant_options 
ADD CONSTRAINT variant_options_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_variants 
ADD CONSTRAINT product_variants_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add update trigger for product_variants
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_variant_options_product_id ON public.variant_options(product_id);
CREATE INDEX idx_variant_options_type ON public.variant_options(variant_type);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_active ON public.product_variants(active);
CREATE INDEX idx_product_variants_combination ON public.product_variants USING GIN(variant_combination);