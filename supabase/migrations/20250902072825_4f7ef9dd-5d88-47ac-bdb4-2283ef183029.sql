-- Fix security issues found by linter

-- Enable RLS on tables that were missing it
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
DROP FUNCTION IF EXISTS public.is_admin(UUID);
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

DROP FUNCTION IF EXISTS public.is_super_admin(UUID);
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role = 'super_admin'
  );
$$;

DROP FUNCTION IF EXISTS public.update_system_metrics();
CREATE OR REPLACE FUNCTION public.update_system_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update total users
    INSERT INTO public.system_metrics (metric_name, metric_value, metric_type, dimensions)
    VALUES ('total_users', (SELECT COUNT(*) FROM public.users), 'gauge', '{"category": "users"}');
    
    -- Update active subscriptions
    INSERT INTO public.system_metrics (metric_name, metric_value, metric_type, dimensions)
    VALUES ('active_subscriptions', 
            (SELECT COUNT(*) FROM public.user_subscriptions WHERE status = 'active'), 
            'gauge', '{"category": "subscriptions"}');
    
    -- Update daily symptoms logged (today)
    INSERT INTO public.system_metrics (metric_name, metric_value, metric_type, dimensions)
    VALUES ('daily_symptoms_logged', 
            (SELECT COUNT(*) FROM public.symptoms WHERE DATE(timestamp) = CURRENT_DATE), 
            'counter', '{"category": "symptoms", "period": "daily"}');
END;
$$;

DROP FUNCTION IF EXISTS public.audit_trigger_function();
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        changes,
        metadata
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'UPDATE' THEN 
                jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN 
                to_jsonb(OLD)
            ELSE 
                to_jsonb(NEW)
        END,
        jsonb_build_object('timestamp', now(), 'table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;