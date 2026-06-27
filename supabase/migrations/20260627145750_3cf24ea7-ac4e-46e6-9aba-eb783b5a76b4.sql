DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'admin-help-digest') THEN
    PERFORM cron.unschedule('admin-help-digest');
  END IF;
END $$;

SELECT cron.schedule(
  'admin-help-digest',
  '5 13 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--7bd75e72-bac5-48da-b75c-ba57a9a40041.lovable.app/lovable/cron/admin-help-digest',
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