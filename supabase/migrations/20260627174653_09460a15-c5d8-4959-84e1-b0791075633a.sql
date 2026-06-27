DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'funnel-alert') THEN
    PERFORM cron.unschedule('funnel-alert');
  END IF;
END $$;

SELECT cron.schedule(
  'funnel-alert',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--7bd75e72-bac5-48da-b75c-ba57a9a40041.lovable.app/lovable/cron/funnel-alert',
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