-- Add push_subscription column to profiles table for storing web push subscriptions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT NULL;

-- Create index for faster lookup of users with push subscriptions
CREATE INDEX IF NOT EXISTS idx_profiles_push_subscription ON public.profiles ((push_subscription IS NOT NULL)) WHERE push_subscription IS NOT NULL;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP calls from cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;