-- 1) New columns for resident vs. professional reports
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'resident',
  ADD COLUMN IF NOT EXISTS verified_by_engineer uuid REFERENCES public.volunteer_engineers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS engineer_notes text;

-- 2) Damage aggregates (map) — add orange + verified
DROP FUNCTION IF EXISTS public.get_damage_aggregates();
CREATE FUNCTION public.get_damage_aggregates()
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
  GROUP BY 1, 2;
$function$;

-- 3) Damage totals (home + map headline) — add orange + verified
DROP FUNCTION IF EXISTS public.get_damage_totals();
CREATE FUNCTION public.get_damage_totals()
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
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL;
$function$;

-- 4) Admin assessment stats — add orange
DROP FUNCTION IF EXISTS public.get_admin_assessment_stats();
CREATE FUNCTION public.get_admin_assessment_stats()
 RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, analyzed integer, drafts integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'orange')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int,
    COUNT(*) FILTER (WHERE status = 'analyzed')::int,
    COUNT(*) FILTER (WHERE status = 'draft')::int
  FROM public.assessments;
$function$;

-- 5) Admin top states — add orange
DROP FUNCTION IF EXISTS public.get_admin_top_states();
CREATE FUNCTION public.get_admin_top_states()
 RETURNS TABLE(state text, total integer, green integer, yellow integer, orange integer, red integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(NULLIF(TRIM(state), ''), 'Desconocido') AS state,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'orange')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int
  FROM public.assessments
  WHERE status = 'analyzed' AND risk_level IS NOT NULL
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 12;
$function$;

-- 6) Admin timeseries — add orange
DROP FUNCTION IF EXISTS public.get_admin_assessment_timeseries();
CREATE FUNCTION public.get_admin_assessment_timeseries()
 RETURNS TABLE(day date, total integer, green integer, yellow integer, orange integer, red integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    (created_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'orange')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int
  FROM public.assessments
  WHERE created_at >= now() - interval '30 days'
  GROUP BY 1
  ORDER BY 1;
$function$;

-- 7) Risk factors drill-down — add orange
DROP FUNCTION IF EXISTS public.get_risk_factors(text, text);
CREATE FUNCTION public.get_risk_factors(_state text DEFAULT NULL::text, _municipality text DEFAULT NULL::text)
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

-- 8) Building peers — add orange
DROP FUNCTION IF EXISTS public.get_building_peers(text, text, text);
CREATE FUNCTION public.get_building_peers(_state text, _municipality text, _building_key text)
 RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, last_report timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    MAX(a.created_at) AS last_report
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND a.building_key IS NOT NULL
    AND _building_key IS NOT NULL AND TRIM(_building_key) <> ''
    AND a.building_key = _building_key
    AND COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = COALESCE(NULLIF(TRIM(_state), ''), 'Desconocido')
    AND COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = COALESCE(NULLIF(TRIM(_municipality), ''), 'Desconocido');
$function$;

-- 9) Admin building clusters — add orange
DROP FUNCTION IF EXISTS public.get_admin_building_clusters(text);
CREATE FUNCTION public.get_admin_building_clusters(_state text DEFAULT NULL::text)
 RETURNS TABLE(state text, municipality text, building_name text, building_key text, total integer, green integer, yellow integer, orange integer, red integer, last_report timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    (array_agg(a.building_name ORDER BY a.created_at DESC) FILTER (WHERE a.building_name IS NOT NULL))[1] AS building_name,
    a.building_key,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
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

-- 10) Admin state reports — add report_type
DROP FUNCTION IF EXISTS public.get_admin_state_reports(text, integer);
CREATE FUNCTION public.get_admin_state_reports(_state text, _limit integer DEFAULT 25)
 RETURNS TABLE(public_id text, created_at timestamp with time zone, risk_level text, report_type text, municipality text, building_type text, age text, structural_type text, seismic_intensity numeric, flagged_count integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    a.public_id,
    a.created_at,
    a.risk_level,
    a.report_type,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    a.property->>'buildingType' AS building_type,
    a.property->>'age' AS age,
    a.property->>'structuralType' AS structural_type,
    CASE WHEN (a.property->>'seismicIntensity') ~ '^[0-9.]+$' THEN (a.property->>'seismicIntensity')::numeric ELSE NULL END AS seismic_intensity,
    (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e WHERE (e->>'value') IN ('yes','unsure')) AS flagged_count
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state
  ORDER BY a.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$function$;

-- Re-apply the security hardening from the prior security pass: keep these
-- helper functions off the public/anon execute grants.
REVOKE EXECUTE ON FUNCTION public.get_admin_assessment_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_top_states() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_assessment_timeseries() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_building_clusters(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_state_reports(text, integer) FROM PUBLIC, anon;