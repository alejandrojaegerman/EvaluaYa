-- Risk factor aggregation for "why" drill-downs (map + admin).
-- Anonymized, read-only. SECURITY DEFINER so the locked assessments table
-- stays private; execute restricted to service_role per existing hardening.

CREATE OR REPLACE FUNCTION public.get_risk_factors(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL
)
RETURNS TABLE(
  factor_group text,
  factor_key text,
  total integer,
  green integer,
  yellow integer,
  red integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH scoped AS (
    SELECT a.risk_level, a.property, a.answers
    FROM public.assessments a
    WHERE a.status = 'analyzed'
      AND a.risk_level IS NOT NULL
      AND (
        _state IS NULL
        OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state
      )
      AND (
        _municipality IS NULL
        OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality
      )
  ),
  -- Flagged checklist items: value in ('yes','unsure')
  checklist AS (
    SELECT
      'checklist'::text AS factor_group,
      (ans->>'id')::text AS factor_key,
      s.risk_level
    FROM scoped s
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(s.answers) = 'array' THEN s.answers ELSE '[]'::jsonb END
    ) AS ans
    WHERE (ans->>'value') IN ('yes', 'unsure')
      AND (ans->>'id') IS NOT NULL
  ),
  -- Building age
  age AS (
    SELECT
      'age'::text AS factor_group,
      COALESCE(NULLIF(TRIM(s.property->>'age'), ''), 'unknown') AS factor_key,
      s.risk_level
    FROM scoped s
  ),
  -- Building type
  btype AS (
    SELECT
      'type'::text AS factor_group,
      COALESCE(NULLIF(TRIM(s.property->>'buildingType'), ''), 'unknown') AS factor_key,
      s.risk_level
    FROM scoped s
  ),
  -- Seismic intensity bands (MMI). null -> unknown.
  intensity AS (
    SELECT
      'intensity'::text AS factor_group,
      CASE
        WHEN (s.property->>'seismicIntensity') IS NULL
          OR TRIM(s.property->>'seismicIntensity') = '' THEN 'unknown'
        WHEN (s.property->>'seismicIntensity')::numeric >= 8 THEN 'severe'
        WHEN (s.property->>'seismicIntensity')::numeric >= 6 THEN 'strong'
        WHEN (s.property->>'seismicIntensity')::numeric >= 5 THEN 'moderate'
        ELSE 'light'
      END AS factor_key,
      s.risk_level
    FROM scoped s
  ),
  -- Deterministic safety-rule triggers (mirrors src/lib/safety-rules.ts).
  rules AS (
    SELECT 'safety_rule'::text AS factor_group, r.factor_key, s.risk_level
    FROM scoped s
    CROSS JOIN LATERAL (
      VALUES
        ('urm',
          s.property->>'structuralType' = 'URM'),
        ('liquefaction',
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END
            ) e WHERE e->>'id'='liquefaction' AND e->>'value'='yes')),
        ('pounding',
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END
            ) e WHERE e->>'id'='pounding' AND e->>'value'='yes')),
        ('plumbing',
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(s.answers)='array' THEN s.answers ELSE '[]'::jsonb END
            ) e WHERE e->>'id'='plumbing' AND e->>'value'='yes')),
        ('severe_shaking',
          (CASE WHEN (s.property->>'seismicIntensity') ~ '^[0-9.]+$'
                THEN (s.property->>'seismicIntensity')::numeric >= 8 ELSE false END)
          OR
          (CASE WHEN (s.property->>'pga') ~ '^[0-9.]+$'
                THEN (s.property->>'pga')::numeric >= 0.5 ELSE false END))
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
    factor_group,
    factor_key,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int AS red
  FROM unioned
  GROUP BY factor_group, factor_key;
$function$;

REVOKE ALL ON FUNCTION public.get_risk_factors(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_factors(text, text) TO service_role;

-- Individual recent reports for the admin drill-down. No address / PII.
CREATE OR REPLACE FUNCTION public.get_admin_state_reports(
  _state text,
  _limit integer DEFAULT 25
)
RETURNS TABLE(
  public_id text,
  created_at timestamp with time zone,
  risk_level text,
  municipality text,
  building_type text,
  age text,
  structural_type text,
  seismic_intensity numeric,
  flagged_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    a.public_id,
    a.created_at,
    a.risk_level,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    a.property->>'buildingType' AS building_type,
    a.property->>'age' AS age,
    a.property->>'structuralType' AS structural_type,
    CASE WHEN (a.property->>'seismicIntensity') ~ '^[0-9.]+$'
         THEN (a.property->>'seismicIntensity')::numeric ELSE NULL END AS seismic_intensity,
    (
      SELECT COUNT(*)::int
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END
      ) e
      WHERE (e->>'value') IN ('yes','unsure')
    ) AS flagged_count
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state
  ORDER BY a.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$function$;

REVOKE ALL ON FUNCTION public.get_admin_state_reports(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_state_reports(text, integer) TO service_role;