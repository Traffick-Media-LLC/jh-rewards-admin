-- Create table to track redeemed codes
CREATE TABLE public.redeemed_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  api_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own redeemed codes" 
ON public.redeemed_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeemed codes" 
ON public.redeemed_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redeemed codes" 
ON public.redeemed_codes 
FOR SELECT 
USING (has_role('admin'::app_role));

-- Create unique constraint to prevent duplicate redemptions
CREATE UNIQUE INDEX idx_redeemed_codes_user_code ON public.redeemed_codes(user_id, code);

-- Add index for faster lookups
CREATE INDEX idx_redeemed_codes_code ON public.redeemed_codes(code);
CREATE INDEX idx_redeemed_codes_user_created ON public.redeemed_codes(user_id, created_at DESC);