-- Add Shopify integration fields to products table
ALTER TABLE public.products 
ADD COLUMN shopify_variant_id TEXT,
ADD COLUMN shopify_product_id TEXT;

-- Add Shopify customer mapping to profiles table
ALTER TABLE public.profiles 
ADD COLUMN shopify_customer_id TEXT;

-- Add Shopify order tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN shopify_order_id TEXT,
ADD COLUMN fulfillment_status TEXT DEFAULT 'pending',
ADD COLUMN tracking_number TEXT,
ADD COLUMN tracking_url TEXT,
ADD COLUMN shopify_financial_status TEXT DEFAULT 'paid';

-- Create index for efficient lookups
CREATE INDEX idx_products_shopify_variant_id ON public.products(shopify_variant_id);
CREATE INDEX idx_profiles_shopify_customer_id ON public.profiles(shopify_customer_id);
CREATE INDEX idx_orders_shopify_order_id ON public.orders(shopify_order_id);

-- Add comments for documentation
COMMENT ON COLUMN public.products.shopify_variant_id IS 'Shopify variant ID for product fulfillment';
COMMENT ON COLUMN public.products.shopify_product_id IS 'Shopify product ID for reference';
COMMENT ON COLUMN public.profiles.shopify_customer_id IS 'Shopify customer ID for order creation';
COMMENT ON COLUMN public.orders.shopify_order_id IS 'Shopify order ID for tracking';
COMMENT ON COLUMN public.orders.fulfillment_status IS 'Order fulfillment status: pending, fulfilled, cancelled';
COMMENT ON COLUMN public.orders.tracking_number IS 'Shipment tracking number';
COMMENT ON COLUMN public.orders.tracking_url IS 'Shipment tracking URL';