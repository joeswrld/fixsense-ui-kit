-- Schedule the subscription reconciliation job to run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-subscription-reconciliation',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://nflwheveqglnxgfmimpq.supabase.co/functions/v1/subscription-reconciliation',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHdoZXZlcWdsbnhnZm1pbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDU1MTMsImV4cCI6MjA2NDcyMTUxM30.RL_pZNgj2W9jD2mKKbqxEt9RP8tT2c2QT-7W5NKq4eU"}'::jsonb,
      body := concat('{"triggered_at": "', now()::text, '", "source": "pg_cron"}')::jsonb
    ) AS request_id;
  $$
);