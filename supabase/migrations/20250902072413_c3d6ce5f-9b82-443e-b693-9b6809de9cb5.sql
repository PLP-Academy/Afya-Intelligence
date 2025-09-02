-- Create admin role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to users table
ALTER TABLE public.users ADD COLUMN role public.app_role DEFAULT 'user';

-- Create admin_users table for enhanced admin features
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  assigned_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create system_metrics table for dashboard analytics
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL, -- 'counter', 'gauge', 'histogram'
  dimensions JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on system_metrics
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
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

-- Create security definer function to check super admin role
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

-- RLS policies for admin_users table
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
  FOR ALL USING (public.is_super_admin());

-- RLS policies for system_metrics table
CREATE POLICY "Admins can view system_metrics" ON public.system_metrics
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert system_metrics" ON public.system_metrics
  FOR INSERT WITH CHECK (public.is_admin());

-- Update users table RLS to allow admin access
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update user profiles" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Update audit_logs RLS policies
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Update symptoms table to allow admin access
CREATE POLICY "Admins can view all symptoms" ON public.symptoms
  FOR SELECT USING (public.is_admin());

-- Update subscriptions tables for admin access
CREATE POLICY "Admins can view all subscription_logs" ON public.subscription_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage subscription_logs" ON public.subscription_logs
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view all user_subscriptions" ON public.user_subscriptions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage user_subscriptions" ON public.user_subscriptions
  FOR ALL USING (public.is_admin());

-- Update triggers for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to key tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_symptoms_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.symptoms
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_subscriptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Insert initial system metrics
INSERT INTO public.system_metrics (metric_name, metric_value, metric_type, dimensions) VALUES
('total_users', 0, 'gauge', '{"category": "users"}'),
('active_subscriptions', 0, 'gauge', '{"category": "subscriptions"}'),
('daily_symptoms_logged', 0, 'counter', '{"category": "symptoms", "period": "daily"}'),
('monthly_revenue', 0, 'gauge', '{"category": "revenue", "period": "monthly"}');

-- Create function to update system metrics
CREATE OR REPLACE FUNCTION public.update_system_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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