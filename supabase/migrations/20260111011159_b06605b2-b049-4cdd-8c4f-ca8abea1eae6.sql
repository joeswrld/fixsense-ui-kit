
-- Fix security for views by recreating them with security_invoker = true
-- This ensures they inherit RLS from underlying tables

-- Drop and recreate transaction_summary view with security invoker
DROP VIEW IF EXISTS public.transaction_summary;

CREATE VIEW public.transaction_summary
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.user_id,
  p.email AS user_email,
  t.amount,
  t.amount AS amount_naira,
  t.status,
  t.plan,
  t.reference,
  t.payment_method,
  t.created_at,
  t.updated_at
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id;

-- Drop and recreate user_usage_summary view with security invoker
DROP VIEW IF EXISTS public.user_usage_summary;

CREATE VIEW public.user_usage_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id AS user_id,
  p.subscription_tier,
  p.subscription_status,
  p.payment_required,
  p.subscription_end_date,
  CASE
    WHEN p.subscription_tier = 'free' THEN date_trunc('month', CURRENT_DATE::timestamp with time zone)
    WHEN p.subscription_start_date IS NOT NULL THEN p.subscription_start_date
    ELSE date_trunc('month', CURRENT_DATE::timestamp with time zone)
  END AS current_period_start,
  CASE
    WHEN p.subscription_tier = 'free' THEN ((date_trunc('month', CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)::date)::timestamp with time zone
    WHEN p.subscription_end_date IS NOT NULL THEN p.subscription_end_date
    ELSE ((date_trunc('month', CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)::date)::timestamp with time zone
  END AS current_period_end,
  COALESCE(count(d.id) FILTER (WHERE d.input_type = 'photo'), 0)::integer AS photo_usage,
  CASE p.subscription_tier
    WHEN 'free' THEN 2
    WHEN 'pro' THEN 30
    WHEN 'business' THEN 60
    ELSE 2
  END AS photo_limit,
  COALESCE(count(d.id) FILTER (WHERE d.input_type = 'video'), 0)::integer AS video_usage,
  CASE p.subscription_tier
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 2
    WHEN 'business' THEN 5
    ELSE 0
  END AS video_limit,
  COALESCE(count(d.id) FILTER (WHERE d.input_type = 'audio'), 0)::integer AS audio_usage,
  CASE p.subscription_tier
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 10
    WHEN 'business' THEN 20
    ELSE 0
  END AS audio_limit,
  COALESCE(count(d.id) FILTER (WHERE d.input_type = 'text'), 0)::integer AS text_usage,
  CASE p.subscription_tier
    WHEN 'free' THEN 3
    WHEN 'pro' THEN 40
    WHEN 'business' THEN 150
    ELSE 3
  END AS text_limit
FROM profiles p
LEFT JOIN diagnostics d ON d.user_id = p.id 
  AND d.created_at >= CASE
    WHEN p.subscription_tier = 'free' THEN date_trunc('month', CURRENT_DATE::timestamp with time zone)
    WHEN p.subscription_start_date IS NOT NULL THEN p.subscription_start_date
    ELSE date_trunc('month', CURRENT_DATE::timestamp with time zone)
  END
GROUP BY p.id;

-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);
