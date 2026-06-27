-- Schedule the once-daily engineer help-request digest.
-- Calls the protected app route /lovable/cron/engineer-digest, which renders
-- and enqueues a digest email for every approved engineer that still has open
-- help requests in their area. Authorized with the vault-stored service_role
-- key (same mechanism as the email-queue worker).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'engineer-help-digest') THEN
    PERFORM cron.unschedule('engineer-help-digest');
  END IF;
END $$;

-- Runs daily at 13:00 UTC (~8-9am US Eastern).
SELECT cron.schedule(
  'engineer-help-digest',
  '0 13 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--7bd75e72-bac5-48da-b75c-ba57a9a40041.lovable.app/lovable/cron/engineer-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);
