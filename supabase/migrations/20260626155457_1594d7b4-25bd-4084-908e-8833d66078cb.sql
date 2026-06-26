-- Admin analytics + matching notification RPCs.
-- All SECURITY DEFINER, search_path pinned, executable only by service_role
-- (called from server functions via the service-role client).

-- Approved engineers (with email) covering a state — used to notify on new requests.
CREATE OR REPLACE FUNCTION public.get_engineers_to_notify(_state text)
RETURNS TABLE(id uuid, name text, email text, access_token uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id, e.name, e.email, e.access_token
  FROM public.volunteer_engineers e
  WHERE e.status = 'approved'
    AND e.email IS NOT NULL AND TRIM(e.email) <> ''
    AND e.access_token IS NOT NULL
    AND (
      _state IS NULL OR _state = ''
      OR _state = ANY (e.states)
      OR array_length(e.states, 1) IS NULL
      OR e.states = '{}'
    );
$$;

-- Assessment headline stats.
CREATE OR REPLACE FUNCTION public.get_admin_assessment_stats()
RETURNS TABLE(total int, green int, yellow int, red int, analyzed int, drafts int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int,
    COUNT(*) FILTER (WHERE status = 'analyzed')::int,
    COUNT(*) FILTER (WHERE status = 'draft')::int
  FROM public.assessments;
$$;

-- Daily assessment counts for the last 30 days.
CREATE OR REPLACE FUNCTION public.get_admin_assessment_timeseries()
RETURNS TABLE(day date, total int, green int, yellow int, red int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (created_at AT TIME ZONE 'UTC')::date AS day,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int
  FROM public.assessments
  WHERE created_at >= now() - interval '30 days'
  GROUP BY 1
  ORDER BY 1;
$$;

-- Top estados by analyzed-report volume.
CREATE OR REPLACE FUNCTION public.get_admin_top_states()
RETURNS TABLE(state text, total int, green int, yellow int, red int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(state), ''), 'Desconocido') AS state,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int
  FROM public.assessments
  WHERE status = 'analyzed' AND risk_level IS NOT NULL
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 12;
$$;

-- Volunteer roster stats.
CREATE OR REPLACE FUNCTION public.get_admin_volunteer_stats()
RETURNS TABLE(total int, pending int, approved int, rejected int, individuals int, organizations int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE status = 'pending')::int,
    COUNT(*) FILTER (WHERE status = 'approved')::int,
    COUNT(*) FILTER (WHERE status = 'rejected')::int,
    COUNT(*) FILTER (WHERE volunteer_type = 'individual')::int,
    COUNT(*) FILTER (WHERE volunteer_type = 'organization')::int
  FROM public.volunteer_engineers;
$$;

-- Approved-engineer coverage count per estado.
CREATE OR REPLACE FUNCTION public.get_admin_engineer_coverage()
RETURNS TABLE(state text, engineers int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s AS state, COUNT(*)::int AS engineers
  FROM public.volunteer_engineers e, unnest(e.states) AS s
  WHERE e.status = 'approved'
  GROUP BY s
  ORDER BY 2 DESC;
$$;

-- Help-request matching stats incl. average time-to-claim (seconds).
CREATE OR REPLACE FUNCTION public.get_admin_matching_stats()
RETURNS TABLE(total int, open int, claimed int, closed int, avg_claim_seconds double precision)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE status = 'open')::int,
    COUNT(*) FILTER (WHERE status = 'claimed')::int,
    COUNT(*) FILTER (WHERE status = 'closed')::int,
    AVG(EXTRACT(EPOCH FROM (claimed_at - created_at)))
      FILTER (WHERE claimed_at IS NOT NULL)
  FROM public.help_requests;
$$;

-- Estados with open requests but no approved engineer covering them.
CREATE OR REPLACE FUNCTION public.get_admin_coverage_gaps()
RETURNS TABLE(state text, open_requests int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT hr.state, COUNT(*)::int
  FROM public.help_requests hr
  WHERE hr.status = 'open'
    AND hr.state IS NOT NULL AND TRIM(hr.state) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.volunteer_engineers e
      WHERE e.status = 'approved' AND hr.state = ANY (e.states)
    )
  GROUP BY hr.state
  ORDER BY 2 DESC;
$$;

-- Lock down execution: service_role only (server functions use the admin client).
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'get_engineers_to_notify(text)',
    'get_admin_assessment_stats()',
    'get_admin_assessment_timeseries()',
    'get_admin_top_states()',
    'get_admin_volunteer_stats()',
    'get_admin_engineer_coverage()',
    'get_admin_matching_stats()',
    'get_admin_coverage_gaps()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role;', fn);
  END LOOP;
END $$;