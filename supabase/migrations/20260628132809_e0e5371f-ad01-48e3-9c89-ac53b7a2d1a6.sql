
-- 1. Schema: volunteer_engineers
ALTER TABLE public.volunteer_engineers
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS credential_path text,
  ADD COLUMN IF NOT EXISTS trust_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Schema: help_requests
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS resident_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS reclaim_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS resident_confirmed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS help_requests_resident_token_idx
  ON public.help_requests (resident_token);

-- 3. RPC: requests needing automated action (reclaim or reminder)
CREATE OR REPLACE FUNCTION public.get_requests_needing_action()
RETURNS TABLE(
  id uuid, public_id text, state text, municipality text, risk_level text,
  progress_stage text, claimed_at timestamptz, progress_updated_at timestamptz,
  reminder_count int, last_reminder_at timestamptz,
  engineer_id uuid, engineer_name text, engineer_email text, engineer_token uuid,
  action text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH base AS (
    SELECT hr.*, COALESCE(hr.progress_updated_at, hr.claimed_at) AS stage_since
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
           AND b.stage_since < now() - interval '24 hours'
           AND COALESCE(b.reminder_count, 0) < 3
           AND (b.last_reminder_at IS NULL OR b.last_reminder_at < now() - interval '24 hours')
        THEN 'remind'
      ELSE 'none'
    END AS action
  FROM base b
  LEFT JOIN public.volunteer_engineers e ON e.id = b.claimed_by;
$$;

-- 4. RPC: per-engineer impact stats + recognition tier
CREATE OR REPLACE FUNCTION public.get_engineer_stats(_engineer_id uuid)
RETURNS TABLE(
  resolved int, claimed_active int, open_in_area int,
  avg_response_seconds double precision, tier text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH e AS (
    SELECT id, states FROM public.volunteer_engineers WHERE id = _engineer_id
  ),
  r AS (
    SELECT
      COUNT(*) FILTER (WHERE progress_stage = 'resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE status = 'claimed')::int AS claimed_active,
      AVG(EXTRACT(EPOCH FROM (claimed_at - created_at)))
        FILTER (WHERE claimed_at IS NOT NULL) AS avg_response_seconds
    FROM public.help_requests WHERE claimed_by = _engineer_id
  ),
  o AS (
    SELECT COUNT(*)::int AS open_in_area
    FROM public.help_requests hr, e
    WHERE hr.status = 'open'
      AND (hr.state IS NULL OR TRIM(hr.state) = '' OR hr.state = ANY (e.states)
           OR array_length(e.states, 1) IS NULL OR e.states = '{}')
  )
  SELECT
    COALESCE(r.resolved, 0), COALESCE(r.claimed_active, 0),
    COALESCE(o.open_in_area, 0), r.avg_response_seconds,
    CASE
      WHEN COALESCE(r.resolved, 0) >= 10 THEN 'gold'
      WHEN COALESCE(r.resolved, 0) >= 4 THEN 'silver'
      WHEN COALESCE(r.resolved, 0) >= 1 THEN 'bronze'
      ELSE 'none'
    END AS tier
  FROM r, o;
$$;

-- 5. RPC: public verified-engineer roster with resolved count + tier
CREATE OR REPLACE FUNCTION public.get_verified_engineers_public()
RETURNS TABLE(
  id uuid, name text, organization text, states text[],
  volunteer_type text, resolved int, tier text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    e.id, e.name, e.organization, e.states, e.volunteer_type,
    COALESCE(rc.resolved, 0)::int AS resolved,
    CASE
      WHEN COALESCE(rc.resolved, 0) >= 10 THEN 'gold'
      WHEN COALESCE(rc.resolved, 0) >= 4 THEN 'silver'
      WHEN COALESCE(rc.resolved, 0) >= 1 THEN 'bronze'
      ELSE 'none'
    END AS tier
  FROM public.volunteer_engineers e
  LEFT JOIN (
    SELECT claimed_by, COUNT(*) AS resolved
    FROM public.help_requests
    WHERE progress_stage = 'resolved'
    GROUP BY claimed_by
  ) rc ON rc.claimed_by = e.id
  WHERE e.status = 'approved'
  ORDER BY COALESCE(rc.resolved, 0) DESC, e.created_at ASC;
$$;

-- 6. Extend admin matching progress with reclaimed + resident-confirmed
DROP FUNCTION IF EXISTS public.get_admin_matching_progress();
CREATE OR REPLACE FUNCTION public.get_admin_matching_progress()
RETURNS TABLE(
  claimed_only int, contacted int, visited int, resolved int,
  stalled int, reclaimed int, resident_confirmed int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
    )::int AS stalled,
    COALESCE(SUM(reclaim_count), 0)::int AS reclaimed,
    COUNT(*) FILTER (WHERE resident_confirmed_at IS NOT NULL)::int AS resident_confirmed
  FROM public.help_requests;
$$;

-- 7. Extend admin help-request list with reclaim + resident-confirm info
DROP FUNCTION IF EXISTS public.get_admin_help_requests(integer);
CREATE OR REPLACE FUNCTION public.get_admin_help_requests(_limit integer DEFAULT 300)
RETURNS TABLE(
  id uuid, state text, municipality text, risk_level text, status text, note text,
  created_at timestamptz, progress_stage text, progress_updated_at timestamptz,
  claimed_at timestamptz, engineer_name text, engineer_note text,
  assessment_public_id text, ai_risk_level text, prior_risk_level text,
  engineer_verdict text, report_type text, stalled boolean,
  reclaim_count int, resident_confirmed_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    hr.id, hr.state, hr.municipality, hr.risk_level, hr.status, hr.note,
    hr.created_at, hr.progress_stage, hr.progress_updated_at, hr.claimed_at,
    e.name AS engineer_name, hr.engineer_note, hr.assessment_public_id,
    a.risk_level AS ai_risk_level, a.prior_risk_level, a.engineer_verdict, a.report_type,
    (
      hr.status = 'claimed'
      AND COALESCE(hr.progress_stage, 'claimed') = 'claimed'
      AND hr.claimed_at IS NOT NULL
      AND hr.claimed_at < now() - interval '24 hours'
    ) AS stalled,
    COALESCE(hr.reclaim_count, 0) AS reclaim_count,
    hr.resident_confirmed_at
  FROM public.help_requests hr
  LEFT JOIN public.volunteer_engineers e ON e.id = hr.claimed_by
  LEFT JOIN public.assessments a ON a.public_id = hr.assessment_public_id
  ORDER BY hr.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
$$;
