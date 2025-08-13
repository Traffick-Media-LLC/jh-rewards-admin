-- Create admin audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for admin audit log
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_role('admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create a function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type TEXT,
  _resource_type TEXT,
  _resource_id TEXT DEFAULT NULL,
  _details JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Only log if user is authenticated and is admin
  IF current_user_id IS NOT NULL AND has_role('admin'::app_role) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      resource_type,
      resource_id,
      details
    ) VALUES (
      current_user_id,
      _action_type,
      _resource_type,
      _resource_id,
      _details
    );
  END IF;
END;
$$;

-- Create trigger to log admin point adjustments
CREATE OR REPLACE FUNCTION public.log_points_adjustment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log admin adjustments (not regular earn/spend)
  IF NEW.type = 'adjustment' THEN
    PERFORM public.log_admin_action(
      'points_adjustment',
      'user_points',
      NEW.user_id::text,
      jsonb_build_object(
        'points_amount', NEW.points,
        'description', NEW.description,
        'transaction_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for points transactions
CREATE TRIGGER log_admin_points_adjustments
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_points_adjustment();

-- Add index for better query performance
CREATE INDEX idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action_type ON public.admin_audit_log(action_type);