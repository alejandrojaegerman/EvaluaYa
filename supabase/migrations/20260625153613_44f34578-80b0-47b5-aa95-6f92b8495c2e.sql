DROP VIEW IF EXISTS public.public_damage_aggregates;

CREATE OR REPLACE FUNCTION public.get_damage_aggregates()
RETURNS TABLE (
  state text,
  municipality text,
  total int,
  green int,
  yellow int,
  red int,
  last_report timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    MAX(a.created_at) AS last_report
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
  GROUP BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.get_damage_aggregates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_aggregates() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_damage_totals()
RETURNS TABLE (
  total int,
  green int,
  yellow int,
  red int,
  areas int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') || '|' || COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido'))::int AS areas
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_damage_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_totals() TO anon, authenticated, service_role;