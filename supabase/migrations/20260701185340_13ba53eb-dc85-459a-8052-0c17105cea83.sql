-- 1. Add resident contact + outcome columns to help_requests
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS resident_email text,
  ADD COLUMN IF NOT EXISTS resident_confirmed_outcome text;

-- 2. Update resident_update_request: record outcome and reopen on "still waiting"
CREATE OR REPLACE FUNCTION public.resident_update_request(_token uuid, _confirm boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _found boolean;
BEGIN
  IF _confirm THEN
    UPDATE public.help_requests
    SET resident_confirmed_at = now(),
        resident_confirmed_outcome = 'resolved'
    WHERE resident_token = _token
    RETURNING true INTO _found;
  ELSE
    UPDATE public.help_requests
    SET resident_confirmed_outcome = 'unresolved',
        status = CASE WHEN status = 'closed' THEN 'closed' ELSE 'open' END,
        claimed_by = CASE WHEN status = 'closed' THEN claimed_by ELSE NULL END,
        claimed_at = CASE WHEN status = 'closed' THEN claimed_at ELSE NULL END,
        progress_stage = CASE WHEN status = 'closed' THEN progress_stage ELSE NULL END,
        progress_updated_at = CASE WHEN status = 'closed' THEN progress_updated_at ELSE NULL END,
        escalated_at = NULL,
        reclaim_count = COALESCE(reclaim_count, 0) + 1
    WHERE resident_token = _token
    RETURNING true INTO _found;
  END IF;
  RETURN COALESCE(_found, false);
END;
$function$;

-- 3. Surface resident_confirmed_outcome to the resident tracking page
DROP FUNCTION IF EXISTS public.get_resident_request(uuid);
CREATE FUNCTION public.get_resident_request(_token uuid)
 RETURNS TABLE(state text, municipality text, risk_level text, status text, progress_stage text, progress_updated_at timestamp with time zone, created_at timestamp with time zone, claimed_at timestamp with time zone, engineer_name text, engineer_note text, assessment_public_id text, resident_confirmed_at timestamp with time zone, ai_risk_level text, prior_risk_level text, report_type text, engineer_verdict text, resident_confirmed_outcome text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    hr.state, hr.municipality, hr.risk_level, hr.status,
    hr.progress_stage, hr.progress_updated_at, hr.created_at,
    hr.claimed_at, e.name AS engineer_name, hr.engineer_note,
    hr.assessment_public_id, hr.resident_confirmed_at,
    a.risk_level AS ai_risk_level, a.prior_risk_level, a.report_type, a.engineer_verdict,
    hr.resident_confirmed_outcome
  FROM public.help_requests hr
  LEFT JOIN public.volunteer_engineers e ON e.id = hr.claimed_by
  LEFT JOIN public.assessments a ON a.public_id = hr.assessment_public_id
  WHERE hr.resident_token = _token
  LIMIT 1;
$function$;

-- 4. Reclaim urgent (red/orange) stalled claims faster (24h) than others (48h)
CREATE OR REPLACE FUNCTION public.get_requests_needing_action()
 RETURNS TABLE(id uuid, public_id text, state text, municipality text, risk_level text, progress_stage text, claimed_at timestamp with time zone, progress_updated_at timestamp with time zone, reminder_count integer, last_reminder_at timestamp with time zone, engineer_id uuid, engineer_name text, engineer_email text, engineer_token uuid, action text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT hr.*, COALESCE(hr.progress_updated_at, hr.claimed_at) AS stage_since,
           CASE WHEN hr.risk_level IN ('red','orange')
                THEN interval '6 hours' ELSE interval '24 hours' END AS idle_threshold,
           CASE WHEN hr.risk_level IN ('red','orange')
                THEN interval '24 hours' ELSE interval '48 hours' END AS reclaim_threshold
    FROM public.help_requests hr
    WHERE hr.status = 'claimed' AND hr.claimed_by IS NOT NULL
  )
  SELECT
    b.id, b.public_id, b.state, b.municipality, b.risk_level,
    b.progress_stage, b.claimed_at, b.progress_updated_at,
    COALESCE(b.reminder_count, 0), b.last_reminder_at,
    e.id, e.name, e.email, e.access_token,
    CASE
      WHEN COALESCE(b.progress_stage, 'claimed') = 'claimed'
           AND b.claimed_at IS NOT NULL
           AND b.claimed_at < now() - b.reclaim_threshold
        THEN 'reclaim'
      WHEN b.stage_since IS NOT NULL
           AND b.stage_since < now() - b.idle_threshold
           AND COALESCE(b.reminder_count, 0) < 3
           AND (b.last_reminder_at IS NULL OR b.last_reminder_at < now() - interval '24 hours')
        THEN 'remind'
      ELSE 'none'
    END AS action
  FROM base b
  LEFT JOIN public.volunteer_engineers e ON e.id = b.claimed_by;
$function$;