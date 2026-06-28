
-- ===========================================================================
-- Admin evaluation-quality & verification reporting RPCs
-- SECURITY DEFINER, search_path pinned, EXECUTE revoked from public roles.
-- Called only server-side via the service role behind the admin secret.
-- ===========================================================================

-- 1) Quality & completeness scorecard ---------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_quality_metrics()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      a.risk_level,
      a.report_type,
      a.engineer_verdict,
      a.verified_by_engineer,
      a.engineer_verified_at,
      COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END), 0) AS answer_count,
      (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e
        WHERE e->>'photoPath' IS NOT NULL AND TRIM(e->>'photoPath') <> '') AS photo_count,
      (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e
        WHERE e->>'value' = 'unsure') AS unsure_count,
      (COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = 'Desconocido'
        OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = 'Desconocido') AS missing_location,
      ((a.building_name IS NULL OR TRIM(a.building_name) = '')
        AND (a.building_key IS NULL OR TRIM(a.building_key) = '')) AS missing_building,
      (NOT ((a.property->>'seismicIntensity') ~ '^[0-9.]+$')) AS missing_intensity
    FROM public.assessments a
    WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
  ),
  flags AS (
    SELECT
      *,
      (photo_count = 0) AS no_photos,
      (answer_count > 0 AND unsure_count * 2 >= answer_count) AS mostly_unsure,
      (answer_count <= 1) AS thin,
      (engineer_verdict IS NOT NULL OR verified_by_engineer IS NOT NULL OR engineer_verified_at IS NOT NULL) AS verified
    FROM base
  )
  SELECT jsonb_build_object(
    'total', COUNT(*)::int,
    'withPhotos', COUNT(*) FILTER (WHERE NOT no_photos)::int,
    'noPhotos', COUNT(*) FILTER (WHERE no_photos)::int,
    'mostlyUnsure', COUNT(*) FILTER (WHERE mostly_unsure)::int,
    'thin', COUNT(*) FILTER (WHERE thin)::int,
    'missingLocation', COUNT(*) FILTER (WHERE missing_location)::int,
    'missingBuilding', COUNT(*) FILTER (WHERE missing_building)::int,
    'missingIntensity', COUNT(*) FILTER (WHERE missing_intensity)::int,
    'complete', COUNT(*) FILTER (WHERE NOT missing_location AND NOT missing_building AND NOT missing_intensity)::int,
    'professional', COUNT(*) FILTER (WHERE report_type = 'professional')::int,
    'verified', COUNT(*) FILTER (WHERE verified)::int,
    'unverifiedHigh', COUNT(*) FILTER (WHERE risk_level IN ('red','orange') AND NOT verified)::int,
    'lowQuality', COUNT(*) FILTER (WHERE no_photos OR mostly_unsure OR thin)::int
  )
  FROM flags;
$function$;

-- 2) Flagged report worklist ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_flagged_reports(_filter text DEFAULT 'all', _limit integer DEFAULT 50)
 RETURNS TABLE(
   public_id text,
   created_at timestamp with time zone,
   risk_level text,
   report_type text,
   state text,
   municipality text,
   building_type text,
   answer_count integer,
   photo_count integer,
   unsure_count integer,
   flagged_count integer,
   verified boolean,
   no_photos boolean,
   mostly_unsure boolean,
   thin boolean,
   missing_location boolean,
   unverified_high boolean
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      a.public_id,
      a.created_at,
      a.risk_level,
      a.report_type,
      COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
      COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
      a.property->>'buildingType' AS building_type,
      COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END), 0) AS answer_count,
      (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e
        WHERE e->>'photoPath' IS NOT NULL AND TRIM(e->>'photoPath') <> '') AS photo_count,
      (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e
        WHERE e->>'value' = 'unsure') AS unsure_count,
      (SELECT COUNT(*)::int FROM jsonb_array_elements(CASE WHEN jsonb_typeof(a.answers)='array' THEN a.answers ELSE '[]'::jsonb END) e
        WHERE e->>'value' IN ('yes','unsure')) AS flagged_count,
      (a.engineer_verdict IS NOT NULL OR a.verified_by_engineer IS NOT NULL OR a.engineer_verified_at IS NOT NULL) AS verified,
      (COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = 'Desconocido'
        OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = 'Desconocido') AS missing_location
    FROM public.assessments a
    WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
  ),
  flags AS (
    SELECT
      *,
      (photo_count = 0) AS no_photos,
      (answer_count > 0 AND unsure_count * 2 >= answer_count) AS mostly_unsure,
      (answer_count <= 1) AS thin,
      (risk_level IN ('red','orange')
        AND NOT verified) AS unverified_high
    FROM base
  )
  SELECT
    public_id, created_at, risk_level, report_type, state, municipality,
    building_type, answer_count, photo_count, unsure_count, flagged_count,
    verified, no_photos, mostly_unsure, thin, missing_location, unverified_high
  FROM flags
  WHERE
    CASE _filter
      WHEN 'no_photos' THEN no_photos
      WHEN 'mostly_unsure' THEN mostly_unsure
      WHEN 'thin' THEN thin
      WHEN 'missing_location' THEN missing_location
      WHEN 'unverified_high' THEN unverified_high
      ELSE (no_photos OR mostly_unsure OR thin OR missing_location OR unverified_high)
    END
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$function$;

-- 3) Verification metrics ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_verification_metrics()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      a.public_id, a.created_at, a.risk_level, a.report_type,
      COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
      COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
      a.engineer_verdict,
      (a.engineer_verdict IS NOT NULL OR a.verified_by_engineer IS NOT NULL OR a.engineer_verified_at IS NOT NULL) AS verified,
      a.engineer_verified_at
    FROM public.assessments a
    WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total', COUNT(*)::int,
    'professional', COUNT(*) FILTER (WHERE report_type = 'professional')::int,
    'selfAssessed', COUNT(*) FILTER (WHERE report_type IS DISTINCT FROM 'professional')::int,
    'verified', COUNT(*) FILTER (WHERE verified)::int,
    'agree', COUNT(*) FILTER (WHERE engineer_verdict = 'agree')::int,
    'adjust', COUNT(*) FILTER (WHERE engineer_verdict = 'adjust')::int,
    'unverifiedHigh', COUNT(*) FILTER (WHERE risk_level IN ('red','orange') AND NOT verified)::int,
    'unverifiedHighList', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.created_at DESC)
      FROM (
        SELECT public_id, created_at, risk_level, state, municipality
        FROM base
        WHERE risk_level IN ('red','orange') AND NOT verified
        ORDER BY created_at DESC
        LIMIT 25
      ) x
    ), '[]'::jsonb)
  )
  FROM base;
$function$;

-- Lock down: server-side only (service role), like the other admin RPCs.
REVOKE EXECUTE ON FUNCTION public.get_admin_quality_metrics() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_flagged_reports(text, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_verification_metrics() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_quality_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_flagged_reports(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_verification_metrics() TO service_role;
