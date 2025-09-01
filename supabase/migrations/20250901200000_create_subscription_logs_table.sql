-- Create subscription logs table for tracking payment attempts and confirmations
CREATE TABLE public.subscription_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tracking_id VARCHAR(255) UNIQUE NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('registration', 'upgrade')),
  target_tier subscription_tier NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  payment_provider VARCHAR(50) DEFAULT 'instasend',
  status VARCHAR(50) NOT NULL CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'cancelled', 'expired')),
  phone_number VARCHAR(15),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_subscription_logs_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_subscription_logs_user_id ON public.subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_tracking_id ON public.subscription_logs(tracking_id);
CREATE INDEX idx_subscription_logs_status ON public.subscription_logs(status);
CREATE INDEX idx_subscription_logs_payment_type ON public.subscription_logs(payment_type);
CREATE INDEX idx_subscription_logs_created_at ON public.subscription_logs(created_at DESC);

-- Create RLS policies
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription logs
CREATE POLICY "Users can view their own subscription logs"
ON public.subscription_logs
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Only the system can insert subscription logs
CREATE POLICY "Only authenticated users can insert their subscription logs"
ON public.subscription_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.subscription_logs IS 'Tracks all subscription-related payment attempts and confirmations';
COMMENT ON COLUMN public.subscription_logs.tracking_id IS 'Unique payment tracking ID from Instasend';
COMMENT ON COLUMN public.subscription_logs.payment_type IS 'Type of payment: registration or upgrade';
COMMENT ON COLUMN public.subscription_logs.metadata IS 'Additional payment metadata and callback data';
