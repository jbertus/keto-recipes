
-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron with schema extensions;

-- Safely schedule the purge_app_events job
do $$
declare
  v_job_name text := 'purge_app_events_daily';
begin
  -- Check if pg_cron is available
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Attempt to unschedule existing job to prevent duplicates
    -- We wrap this in a block to suppress "could not find valid entry for job" errors
    begin
      perform cron.unschedule(v_job_name);
    exception when others then
      -- Job didn't exist, safe to ignore
      null;
    end;

    -- Schedule the new job
    perform cron.schedule(
      v_job_name,
      '0 3 * * *', -- Run daily at 3:00 AM
      'select public.purge_app_events(90)'
    );
  end if;
end $$;
