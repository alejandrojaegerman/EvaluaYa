
CREATE OR REPLACE FUNCTION public.get_admin_help_requests(_limit integer DEFAULT 300)
 RETURNS TABLE(
   id uuid,
   state text,
   municipality text,
   risk_level text,
   status text,
   note text,
   created_at timestamp with time zone,
   progress_stage text,
   progress_updated_at timestamp with time zone,
   claimed_at timestamp with time zone,
   engineer_name text,
   engineer_note text,
   assessment_public_id text,
   ai_risk_level text,
   prior_risk_level text,
   engineer_verdict text,
   report_type text,
   stalled boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    hr.id,
    hr.state,
    hr.municipality,
    hr.risk_level,
    hr.status,
    hr.note,
    hr.created_at,
    hr.progress_stage,
    hr.progress_updated_at,
    hr.claimed_at,
    e.name AS engineer_name,
    hr.engineer_note,
    hr.assessment_public_id,
    a.risk_level AS ai_risk_level,
    a.prior_risk_level,
    a.engineer_verdict,
    a.report_type,
    (
      hr.status = 'claimed'
      AND COALESCE(hr.progress_stage, 'claimed') = 'claimed'
      AND hr.claimed_at IS NOT NULL
      AND hr.claimed_at < now() - interval '24 hours'
    ) AS stalled
  FROM public.help_requests hr
  LEFT JOIN public.volunteer_engineers e ON e.id = hr.claimed_by
  LEFT JOIN public.assessments a ON a.public_id = hr.assessment_public_id
  ORDER BY hr.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
$function$;

REVOKE ALL ON FUNCTION public.get_admin_help_requests(integer) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.get_admin_matching_progress()
 RETURNS TABLE(
   claimed_only integer,
   contacted integer,
   visited integer,
   resolved integer,
   stalled integer
 )
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
        AND claimed_at < now() - interval '24 hours'
    )::int AS stalled
  FROM public.help_requests;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_matching_progress() FROM PUBLIC, anon;
