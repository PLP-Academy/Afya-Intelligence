-- Fix security issues by temporarily dropping dependent policies and recreating functions

-- First, enable RLS on tables that were missing it
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop policies that depend on the functions we need to recreate
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view system_metrics" ON public.system_metrics;  
DROP POLICY IF EXISTS "Admins can insert system_metrics" ON public.system_metrics;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Admins can view all subscription_logs" ON public.subscription_logs;
DROP POLICY IF EXISTS "Admins can manage subscription_logs" ON public.subscription_logs;
DROP POLICY IF EXISTS "Admins can view all user_subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage user_subscriptions" ON public.user_subscriptions;

-- Now recreate functions with proper search paths
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
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

DROP FUNCTION IF EXISTS public.is_super_admin CASCADE;
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

-- Recreate all the policies with the updated functions
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view system_metrics" ON public.system_metrics
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert system_metrics" ON public.system_metrics
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update user profiles" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all symptoms" ON public.symptoms
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all subscription_logs" ON public.subscription_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage subscription_logs" ON public.subscription_logs
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view all user_subscriptions" ON public.user_subscriptions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage user_subscriptions" ON public.user_subscriptions
  FOR ALL USING (public.is_admin());