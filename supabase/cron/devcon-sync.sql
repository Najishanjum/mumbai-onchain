-- Runs the devcon-sync function every 30 minutes. Run once in the SQL Editor
-- of the production project, after running the devcon_sessions migration and
-- deploying the function with:
--   supabase functions deploy devcon-sync --no-verify-jwt
-- To stop: SELECT cron.unschedule('devcon-sync');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'devcon-sync',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nlzklfxqeqtiukfhzedb.supabase.co/functions/v1/devcon-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
