ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS building_name text,
  ADD COLUMN IF NOT EXISTS building_key text,
  ADD COLUMN IF NOT EXISTS building_inferred boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS assessments_building_idx
  ON public.assessments (state, municipality, building_key)
  WHERE building_key IS NOT NULL;

-- Anonymized peer counts for one building. Counts only — never addresses,
-- photos or report ids. Brokered through the service role (no anon execute).
CREATE OR REPLACE FUNCTION public.get_building_peers(
  _state text,
  _municipality text,
  _building_key text
)
RETURNS TABLE(total integer, green integer, yellow integer, red integer, last_report timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    MAX(a.created_at) AS last_report
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND a.building_key IS NOT NULL
    AND _building_key IS NOT NULL AND TRIM(_building_key) <> ''
    AND a.building_key = _building_key
    AND COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido')
        = COALESCE(NULLIF(TRIM(_state), ''), 'Desconocido')
    AND COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido')
        = COALESCE(NULLIF(TRIM(_municipality), ''), 'Desconocido');
$function$;

REVOKE ALL ON FUNCTION public.get_building_peers(text, text, text) FROM PUBLIC, anon, authenticated;

-- Admin-only: buildings with 2+ analyzed reports, with risk mix.
CREATE OR REPLACE FUNCTION public.get_admin_building_clusters(_state text DEFAULT NULL)
RETURNS TABLE(
  state text,
  municipality text,
  building_name text,
  building_key text,
  total integer,
  green integer,
  yellow integer,
  red integer,
  last_report timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    (array_agg(a.building_name ORDER BY a.created_at DESC)
      FILTER (WHERE a.building_name IS NOT NULL))[1] AS building_name,
    a.building_key,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    MAX(a.created_at) AS last_report
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND a.building_key IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
  GROUP BY 1, 2, a.building_key
  HAVING COUNT(*) >= 2
  ORDER BY COUNT(*) DESC, last_report DESC
  LIMIT 100;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_building_clusters(text) FROM PUBLIC, anon, authenticated;