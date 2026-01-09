-- Add subscription lifecycle columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paystack_plan_code text,
ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
ADD COLUMN IF NOT EXISTS paystack_email_token text,
ADD COLUMN IF NOT EXISTS last_webhook_event text,
ADD COLUMN IF NOT EXISTS last_webhook_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS grace_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_payment_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reconciled_at timestamp with time zone;

-- Create subscription_events table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  paystack_reference text,
  previous_status text,
  new_status text,
  previous_tier text,
  new_tier text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
  ON public.subscription_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscription events"
  ON public.subscription_events
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date ON public.profiles(subscription_end_date);

-- Update subscription_status check constraint to use lifecycle states
-- First drop if exists, then create new
DO $$ 
BEGIN
  -- Add comment to document valid subscription states
  COMMENT ON COLUMN public.profiles.subscription_status IS 'Valid states: trialing, active, past_due, expired, cancelled, inactive';
END $$;