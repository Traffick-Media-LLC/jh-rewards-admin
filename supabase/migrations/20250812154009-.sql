-- Create email logs table for tracking
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies for email logs
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (has_role('admin'::app_role));

CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Create function to send welcome email
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.id;
  
  -- Get first name from profile
  user_first_name := COALESCE(NEW.first_name, 'Juice Head');
  
  -- Call edge function to send welcome email
  PERFORM net.http_post(
    url := 'https://buiyewfwvnpuydzfforc.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'welcome',
      'to', user_email,
      'data', jsonb_build_object(
        'firstName', user_first_name,
        'pointsBalance', NEW.points_balance
      )
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for welcome emails
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();

-- Create function to send code redemption email
CREATE OR REPLACE FUNCTION public.send_code_redemption_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_balance INTEGER;
BEGIN
  -- Only send email for 'earn' transactions (code redemptions)
  IF NEW.type = 'earn' THEN
    -- Get user details
    SELECT p.email, p.first_name, p.points_balance
    INTO user_email, user_first_name, user_balance
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
    
    -- Call edge function to send code redemption email
    PERFORM net.http_post(
      url := 'https://buiyewfwvnpuydzfforc.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'code_redemption',
        'to', user_email,
        'data', jsonb_build_object(
          'firstName', COALESCE(user_first_name, 'Juice Head'),
          'pointsEarned', NEW.points,
          'totalPoints', user_balance,
          'code', COALESCE(NEW.metadata->>'code', 'REWARD')
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for code redemption emails
CREATE TRIGGER send_code_redemption_email_trigger
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.send_code_redemption_email();