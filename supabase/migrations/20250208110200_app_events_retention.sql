
-- Enable pg_cron extension if not already enabled.
-- This is necessary to schedule background jobs in Supabase.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create or replace the function to purge old application events.
-- This function deletes records from the 'app_events' table that are older than a specified number of days.
CREATE OR REPLACE FUNCTION public.purge_app_events(retain_days integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER -- Runs with the privileges of the function owner (typically the database owner)
AS $function$
BEGIN
    DELETE FROM public.app_events
    WHERE created_at < now() - (retain_days || ' days')::interval;
END;
$function$;

-- Schedule a daily cron job to run the purge_app_events function.
-- This job will execute every day at 02:00 AM UTC (2 AM) to clean up old event logs.
-- The default retention is 90 days, meaning events older than 90 days will be deleted.
SELECT cron.schedule(
    'daily-app-events-retention', -- Unique job name
    '0 2 * * *', -- Cron schedule: At 02:00 AM every day
    'SELECT public.purge_app_events(90);' -- SQL command to execute
);

-- Optional: To unschedule the job, you can use:
-- SELECT cron.unschedule('daily-app-events-retention');

-- Optional: To view scheduled jobs:
-- SELECT * FROM cron.job;

-- Optional: To view job run history:
-- SELECT * FROM cron.job_run_details;
