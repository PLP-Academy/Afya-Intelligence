-- Enhance subscription system with additional fields and tables

-- 1. Add phone_number field to users table (if not already added)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15);

-- 2. Add subscription-related fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mpesa',
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';

-- 3. Create user_subscriptions table for advanced subscription management
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tier subscription_tier NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'past_due', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_user_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Create subscription_invoices table for billing history
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  tracking_id VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_data JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_subscription_invoices_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Create audit_logs table for compliance and debugging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON public.users(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user_id ON public.subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. Enable RLS on new tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- 9. Create RLS policies for subscription_invoices
CREATE POLICY "Users can view their own invoices"
ON public.subscription_invoices
FOR SELECT
USING (auth.uid() = user_id);

-- 10. Create RLS policies for audit_logs (limited access)
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 11. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Add triggers for updated_at columns
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Create function to handle subscription status updates
CREATE OR REPLACE FUNCTION public.handle_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Log subscription changes for audit
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, changes, metadata)
    VALUES (
      NEW.user_id,
      'subscription_status_changed',
      'subscription',
      NEW.id,
      json_build_object('old_status', OLD.status, 'new_status', NEW.status),
      json_build_object('new', NEW, 'old', OLD)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Add trigger for subscription status changes
CREATE TRIGGER on_subscription_status_change
  AFTER UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_status();

-- 15. Add comments for documentation
COMMENT ON TABLE public.user_subscriptions IS 'Manages detailed subscription information for users';
COMMENT ON TABLE public.subscription_invoices IS 'Stores billing invoices and payment records';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for important user actions and system events';
COMMENT ON COLUMN public.users.phone_number IS 'M-Pesa phone number for subscriptions';
COMMENT ON COLUMN public.users.trial_started_at IS 'When free trial started';
COMMENT ON COLUMN public.users.trial_ends_at IS 'When free trial expires';

-- 16. Insert default subscription for existing users
INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_start, current_period_end)
SELECT
  id,
  COALESCE(NULLIF(tier, ''), 'community_advocate'::subscription_tier),
  CASE
    WHEN subscription_end_date IS NOT NULL AND subscription_end_date > NOW() THEN 'active'
    ELSE 'inactive'
  END,
  COALESCE(last_payment_date, created_at),
  COALESCE(subscription_end_date, NOW() + INTERVAL '1 month')
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT DO NOTHING;
