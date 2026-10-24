-- Runs the story-cleanup function every hour. Run once in the SQL Editor of
-- the production project, after running the story_cleanup migration and
-- deploying the function with:
--   supabase functions deploy story-cleanup --no-verify-jwt
-- To stop: SELECT cron.unschedule('story-cleanup');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'story-cleanup',
  '17 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nlzklfxqeqtiukfhzedb.supabase.co/functions/v1/story-cleanup',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
