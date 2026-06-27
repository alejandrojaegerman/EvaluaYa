-- Data Room: filterable, anonymized reporting functions (state, municipality, date range)
-- All count-only, no PII. Days bucketed in Eastern time to match existing RPCs.

-- 1) Filtered aggregates by area
CREATE OR REPLACE FUNCTION public.get_damage_aggregates_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(state text, municipality text, total integer, green integer, yellow integer, orange integer, red integer, verified integer, last_report timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(*) FILTER (WHERE a.report_type = 'professional')::int AS verified,
    MAX(a.created_at) AS last_report
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  GROUP BY 1, 2;
$function$;

REVOKE ALL ON FUNCTION public.get_damage_aggregates_filtered(text, text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_aggregates_filtered(text, text, date, date) TO anon, authenticated, service_role;

-- 2) Filtered headline totals
CREATE OR REPLACE FUNCTION public.get_damage_totals_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, verified integer, areas integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(*) FILTER (WHERE a.report_type = 'professional')::int AS verified,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') || '|' || COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido'))::int AS areas
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to);
$function$;

REVOKE ALL ON FUNCTION public.get_damage_totals_filtered(text, text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_totals_filtered(text, text, date, date) TO anon, authenticated, service_role;

-- 3) Filtered daily trend
CREATE OR REPLACE FUNCTION public.get_damage_timeseries_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(day date, total integer, green integer, yellow integer, orange integer, red integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    (a.created_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  GROUP BY 1
  ORDER BY 1;
$function$;

REVOKE ALL ON FUNCTION public.get_damage_timeseries_filtered(text, text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_timeseries_filtered(text, text, date, date) TO anon, authenticated, service_role;

-- 4) Filtered risk-factor breakdown ("why"), with date range
CREATE OR REPLACE FUNCTION public.get_risk_factors_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(factor_group text, factor_key text, total integer, green integer, yellow integer, orange integer, red integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH scoped AS (
    SELECT a.risk_level, a.property, a.answers
    FROM public.assessments a
    WHERE a.status = 'analyzed'
      AND a.risk_level IS NOT NULL
      AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
      AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
      AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
      AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  ),
  checklist AS (
    SELECT 'checklist'::text AS factor_group, (ans->>'id')::text AS factor_key, s.risk_level
    FROM scoped s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s.answers) = 'array' THEN s.answers ELSE '[]'::jsonb END
    ) AS ans
    WHERE (ans->>'value') IN ('yes', 'unsure') AND (ans->>'id') IS NOT NULL
  ),
  age AS (
    SELECT 'age'::text AS factor_group,
      COALESCE(NULLIF(TRIM(s.property->>'age'), ''), 'unknown') AS factor_key, s.risk_level
    FROM scoped s
  ),
  btype AS (
    SELECT 'type'::text AS factor_group,
      COALESCE(NULLIF(TRIM(s.property->>'buildingType'), ''), 'unknown') AS factor_key, s.risk_level
    FROM scoped s
  ),
  intensity AS (
    SELECT 'intensity'::text AS factor_group,
      CASE
        WHEN (s.property->>'seismicIntensity') IS NULL OR TRIM(s.property->>'seismicIntensity') = '' THEN 'unknown'
        WHEN (s.property->>'seismicIntensity')::numeric >= 8 THEN 'severe'
        WHEN (s.property->>'seismicIntensity')::numeric >= 6 THEN 'strong'
        WHEN (s.property->>'seismicIntensity')::numeric >= 5 THEN 'moderate'
        ELSE 'light'
      END AS factor_key, s.risk_level
    FROM scoped s
  ),
  rules AS (
    SELECT 'safety_rule'::text AS factor_group, r.factor_key, s.risk_level
    FROM scoped s
    CROSS JOIN LATERAL (
      VALUES
        ('urm', s.property->>'structuralType' = 'URM'),
        ('liquefaction', EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END) e WHERE e->>'id'='liquefaction' AND e->>'value'='yes')),
        ('pounding', EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END) e WHERE e->>'id'='pounding' AND e->>'value'='yes')),
        ('plumbing', EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END) e WHERE e->>'id'='plumbing' AND e->>'value'='yes')),
        ('severe_shaking',
          (CASE WHEN (s.property->>'seismicIntensity') ~ '^[0-9.]+$' THEN (s.property->>'seismicIntensity')::numeric >= 8 ELSE false END)
          OR (CASE WHEN (s.property->>'pga') ~ '^[0-9.]+$' THEN (s.property->>'pga')::numeric >= 0.5 ELSE false END))
    ) AS r(factor_key, fired)
    WHERE r.fired
  ),
  unioned AS (
    SELECT factor_group, factor_key, risk_level FROM checklist
    UNION ALL SELECT factor_group, factor_key, risk_level FROM age
    UNION ALL SELECT factor_group, factor_key, risk_level FROM btype
    UNION ALL SELECT factor_group, factor_key, risk_level FROM intensity
    UNION ALL SELECT factor_group, factor_key, risk_level FROM rules
  )
  SELECT
    factor_group, factor_key,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int AS red
  FROM unioned
  GROUP BY factor_group, factor_key;
$function$;

REVOKE ALL ON FUNCTION public.get_risk_factors_filtered(text, text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_risk_factors_filtered(text, text, date, date) TO anon, authenticated, service_role;