-- Atomic helpers for the completion engine (cron) and resident self-service.
CREATE OR REPLACE FUNCTION public.reclaim_stalled_request(_id uuid)
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.help_requests
  SET status = 'open',
      claimed_by = NULL,
      claimed_at = NULL,
      progress_stage = NULL,
      progress_updated_at = NULL,
      reclaim_count = COALESCE(reclaim_count, 0) + 1
  WHERE id = _id AND status = 'claimed';
$$;

CREATE OR REPLACE FUNCTION public.mark_request_reminded(_id uuid)
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.help_requests
  SET reminder_count = COALESCE(reminder_count, 0) + 1,
      last_reminder_at = now()
  WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.get_resident_request(_token uuid)
RETURNS TABLE(
  state text, municipality text, risk_level text, status text,
  progress_stage text, progress_updated_at timestamptz, created_at timestamptz,
  claimed_at timestamptz, engineer_name text, engineer_note text,
  assessment_public_id text, resident_confirmed_at timestamptz,
  ai_risk_level text, prior_risk_level text, report_type text, engineer_verdict text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    hr.state, hr.municipality, hr.risk_level, hr.status,
    hr.progress_stage, hr.progress_updated_at, hr.created_at,
    hr.claimed_at, e.name AS engineer_name, hr.engineer_note,
    hr.assessment_public_id, hr.resident_confirmed_at,
    a.risk_level AS ai_risk_level, a.prior_risk_level, a.report_type, a.engineer_verdict
  FROM public.help_requests hr
  LEFT JOIN public.volunteer_engineers e ON e.id = hr.claimed_by
  LEFT JOIN public.assessments a ON a.public_id = hr.assessment_public_id
  WHERE hr.resident_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resident_update_request(_token uuid, _confirm boolean)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _found boolean;
BEGIN
  UPDATE public.help_requests
  SET resident_confirmed_at = CASE WHEN _confirm THEN now() ELSE resident_confirmed_at END
  WHERE resident_token = _token
  RETURNING true INTO _found;
  RETURN COALESCE(_found, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reclaim_stalled_request(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.mark_request_reminded(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_resident_request(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.resident_update_request(uuid, boolean) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.reclaim_stalled_request(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_request_reminded(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_resident_request(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resident_update_request(uuid, boolean) TO service_role;

-- Hourly completion engine: auto-reclaim stalled requests + staged reminders.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'completion-engine') THEN
    PERFORM cron.unschedule('completion-engine');
  END IF;
END $$;

SELECT cron.schedule(
  'completion-engine',
  '15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--7bd75e72-bac5-48da-b75c-ba57a9a40041.lovable.app/lovable/cron/completion-engine',
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
