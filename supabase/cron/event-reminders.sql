-- Runs the event-reminders function every 5 minutes. Run once in the SQL
-- Editor of the production project, after deploying the function with:
--   supabase functions deploy event-reminders --no-verify-jwt
-- The function needs no secret: each reminder is sent once, however often
-- it's called. To stop: SELECT cron.unschedule('event-reminders');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'event-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nlzklfxqeqtiukfhzedb.supabase.co/functions/v1/event-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
