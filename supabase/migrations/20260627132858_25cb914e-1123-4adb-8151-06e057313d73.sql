-- Help requests: progress tracking
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS progress_stage text,
  ADD COLUMN IF NOT EXISTS engineer_note text,
  ADD COLUMN IF NOT EXISTS progress_updated_at timestamptz;

-- Assessments: engineer verdict on the AI evaluation
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS engineer_verdict text,
  ADD COLUMN IF NOT EXISTS engineer_verified_at timestamptz;

-- Daily digest source: approved engineers + their still-open requests
CREATE OR REPLACE FUNCTION public.get_engineer_digest()
RETURNS TABLE(
  engineer_id uuid,
  name text,
  email text,
  access_token uuid,
  open_count integer,
  sample jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    e.id AS engineer_id,
    e.name,
    e.email,
    e.access_token,
    COUNT(hr.id)::int AS open_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'municipality', hr.municipality,
          'state', hr.state,
          'riskLevel', hr.risk_level,
          'createdAt', hr.created_at
        )
        ORDER BY hr.created_at DESC
      ) FILTER (WHERE hr.id IS NOT NULL),
      '[]'::jsonb
    ) AS sample
  FROM public.volunteer_engineers e
  JOIN public.help_requests hr
    ON hr.status = 'open'
    AND (
      hr.state IS NULL
      OR TRIM(hr.state) = ''
      OR hr.state = ANY (e.states)
      OR array_length(e.states, 1) IS NULL
      OR e.states = '{}'
    )
  WHERE e.status = 'approved'
    AND e.email IS NOT NULL AND TRIM(e.email) <> ''
    AND e.access_token IS NOT NULL
    AND (e.token_expires_at IS NULL OR e.token_expires_at > now())
  GROUP BY e.id, e.name, e.email, e.access_token
  HAVING COUNT(hr.id) > 0;
$function$;

REVOKE ALL ON FUNCTION public.get_engineer_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_engineer_digest() TO service_role;