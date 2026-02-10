-- Schedule retry-failed-payments to run daily at 6 AM UTC
SELECT cron.schedule(
  'retry-failed-payments-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nflwheveqglnxgfmimpq.supabase.co/functions/v1/retry-failed-payments',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHdoZXZlcWdsbnhnZm1pbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDk3MTUsImV4cCI6MjA3OTMyNTcxNX0.mb1ZEOJtfbIZ2aaCG92zOtKYYmF-myoDghub_xh7jqM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);