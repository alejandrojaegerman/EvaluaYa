
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

-- 1) Admin help-request list: risk-aware "stalled" (6h for red/orange, 24h otherwise)
DROP FUNCTION IF EXISTS public.get_admin_help_requests(integer);
CREATE OR REPLACE FUNCTION public.get_admin_help_requests(_limit integer DEFAULT 300)
 RETURNS TABLE(id uuid, state text, municipality text, risk_level text, status text, note text, created_at timestamp with time zone, progress_stage text, progress_updated_at timestamp with time zone, claimed_at timestamp with time zone, engineer_name text, engineer_note text, assessment_public_id text, ai_risk_level text, prior_risk_level text, engineer_verdict text, report_type text, stalled boolean, reclaim_count integer, resident_confirmed_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    hr.id, hr.state, hr.municipality, hr.risk_level, hr.status, hr.note,
    hr.created_at, hr.progress_stage, hr.progress_updated_at, hr.claimed_at,
    e.name AS engineer_name, hr.engineer_note, hr.assessment_public_id,
    a.risk_level AS ai_risk_level, a.prior_risk_level, a.engineer_verdict, a.report_type,
    (
      hr.status = 'claimed'
      AND COALESCE(hr.progress_stage, 'claimed') = 'claimed'
      AND hr.claimed_at IS NOT NULL
      AND hr.claimed_at < now() - (
        CASE WHEN hr.risk_level IN ('red','orange')
             THEN interval '6 hours' ELSE interval '24 hours' END
      )
    ) AS stalled,
    COALESCE(hr.reclaim_count, 0) AS reclaim_count,
    hr.resident_confirmed_at
  FROM public.help_requests hr
  LEFT JOIN public.volunteer_engineers e ON e.id = hr.claimed_by
  LEFT JOIN public.assessments a ON a.public_id = hr.assessment_public_id
  ORDER BY hr.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
$function$;

-- 2) Matching progress summary: risk-aware "stalled"
CREATE OR REPLACE FUNCTION public.get_admin_matching_progress()
 RETURNS TABLE(claimed_only integer, contacted integer, visited integer, resolved integer, stalled integer, reclaimed integer, resident_confirmed integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*) FILTER (
      WHERE status = 'claimed' AND COALESCE(progress_stage, 'claimed') = 'claimed'
    )::int AS claimed_only,
    COUNT(*) FILTER (WHERE progress_stage = 'contacted')::int AS contacted,
    COUNT(*) FILTER (WHERE progress_stage = 'visited')::int AS visited,
    COUNT(*) FILTER (WHERE progress_stage = 'resolved')::int AS resolved,
    COUNT(*) FILTER (
      WHERE status = 'claimed'
        AND COALESCE(progress_stage, 'claimed') = 'claimed'
        AND claimed_at IS NOT NULL
        AND claimed_at < now() - (
          CASE WHEN risk_level IN ('red','orange')
               THEN interval '6 hours' ELSE interval '24 hours' END
        )
    )::int AS stalled,
    COALESCE(SUM(reclaim_count), 0)::int AS reclaimed,
    COUNT(*) FILTER (WHERE resident_confirmed_at IS NOT NULL)::int AS resident_confirmed
  FROM public.help_requests;
$function$;

-- 3) Completion engine: remind claimed red/orange after 6h, others after 24h
CREATE OR REPLACE FUNCTION public.get_requests_needing_action()
 RETURNS TABLE(id uuid, public_id text, state text, municipality text, risk_level text, progress_stage text, claimed_at timestamp with time zone, progress_updated_at timestamp with time zone, reminder_count integer, last_reminder_at timestamp with time zone, engineer_id uuid, engineer_name text, engineer_email text, engineer_token uuid, action text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT hr.*, COALESCE(hr.progress_updated_at, hr.claimed_at) AS stage_since,
           CASE WHEN hr.risk_level IN ('red','orange')
                THEN interval '6 hours' ELSE interval '24 hours' END AS idle_threshold
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
           AND b.claimed_at < now() - interval '48 hours'
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

-- 4) Open red/orange requests left unclaimed past 6h, not yet escalated.
CREATE OR REPLACE FUNCTION public.get_open_requests_to_escalate()
 RETURNS TABLE(id uuid, public_id text, state text, municipality text, risk_level text, note text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT hr.id, hr.public_id, hr.state, hr.municipality, hr.risk_level, hr.note, hr.created_at
  FROM public.help_requests hr
  WHERE hr.status = 'open'
    AND hr.risk_level IN ('red','orange')
    AND hr.created_at < now() - interval '6 hours'
    AND hr.escalated_at IS NULL
  ORDER BY hr.created_at ASC
  LIMIT 50;
$function$;

-- 5) Mark a request as escalated (de-dup for the completion engine).
CREATE OR REPLACE FUNCTION public.mark_request_escalated(_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.help_requests
  SET escalated_at = now()
  WHERE id = _id;
$function$;

REVOKE ALL ON FUNCTION public.get_open_requests_to_escalate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_request_escalated(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_open_requests_to_escalate() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_request_escalated(uuid) TO service_role;
