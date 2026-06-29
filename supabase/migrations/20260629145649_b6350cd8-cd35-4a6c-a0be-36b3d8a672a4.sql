-- 1. Schema: denormalized photo counters
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS photo_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_counts jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Backfill from answers JSONB (handles both photoPaths[] and legacy photoPath)
WITH counts AS (
  SELECT
    a.id,
    COALESCE(SUM(
      COALESCE(jsonb_array_length(
        CASE WHEN jsonb_typeof(ans->'photoPaths') = 'array' THEN ans->'photoPaths' ELSE '[]'::jsonb END
      ), 0)
      + CASE WHEN ans->>'photoPath' IS NOT NULL AND TRIM(ans->>'photoPath') <> '' THEN 1 ELSE 0 END
    ), 0)::int AS total,
    COALESCE(
      jsonb_object_agg(
        ans->>'id',
        (
          COALESCE(jsonb_array_length(
            CASE WHEN jsonb_typeof(ans->'photoPaths') = 'array' THEN ans->'photoPaths' ELSE '[]'::jsonb END
          ), 0)
          + CASE WHEN ans->>'photoPath' IS NOT NULL AND TRIM(ans->>'photoPath') <> '' THEN 1 ELSE 0 END
        )
      ) FILTER (
        WHERE ans->>'id' IS NOT NULL
          AND (
            (jsonb_typeof(ans->'photoPaths') = 'array' AND jsonb_array_length(ans->'photoPaths') > 0)
            OR (ans->>'photoPath' IS NOT NULL AND TRIM(ans->>'photoPath') <> '')
          )
      ),
      '{}'::jsonb
    ) AS by_item
  FROM public.assessments a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.answers) = 'array' THEN a.answers ELSE '[]'::jsonb END
  ) AS ans
  GROUP BY a.id
)
UPDATE public.assessments a
SET photo_count = c.total,
    photo_counts = c.by_item
FROM counts c
WHERE a.id = c.id;

-- 3. Per-checklist-item photo coverage (anonymized, counts only)
CREATE OR REPLACE FUNCTION public.get_photo_coverage_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(item_id text, photos integer, reports_with_photo integer, reports_total integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH scoped AS (
    SELECT a.photo_counts
    FROM public.assessments a
    WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
      AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
      AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
      AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
      AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  ),
  total AS (SELECT COUNT(*)::int AS n FROM scoped),
  exploded AS (
    SELECT kv.key AS item_id, (kv.value)::int AS cnt
    FROM scoped s
    CROSS JOIN LATERAL jsonb_each_text(
      CASE WHEN jsonb_typeof(s.photo_counts) = 'object' THEN s.photo_counts ELSE '{}'::jsonb END
    ) AS kv(key, value)
    WHERE (kv.value)::int > 0
  )
  SELECT
    e.item_id,
    SUM(e.cnt)::int AS photos,
    COUNT(*)::int AS reports_with_photo,
    (SELECT n FROM total) AS reports_total
  FROM exploded e
  GROUP BY e.item_id
  ORDER BY reports_with_photo DESC, photos DESC;
$$;

-- 4. Per-area photo aggregates (anonymized, counts only)
CREATE OR REPLACE FUNCTION public.get_photo_aggregates_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(state text, municipality text, photos integer, reports_with_photos integer, reports_total integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS state,
    COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') AS municipality,
    COALESCE(SUM(a.photo_count), 0)::int AS photos,
    COUNT(*) FILTER (WHERE a.photo_count > 0)::int AS reports_with_photos,
    COUNT(*)::int AS reports_total
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  GROUP BY 1, 2;
$$;

-- 5. Photos over time (anonymized, counts only)
CREATE OR REPLACE FUNCTION public.get_photo_timeseries_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(day date, photos integer, reports_with_photos integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (a.created_at AT TIME ZONE 'America/New_York')::date AS day,
    COALESCE(SUM(a.photo_count), 0)::int AS photos,
    COUNT(*) FILTER (WHERE a.photo_count > 0)::int AS reports_with_photos
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to)
  GROUP BY 1
  ORDER BY 1;
$$;

-- 6. Accurate totals using denormalized photo_count (return type changed -> drop first)
DROP FUNCTION IF EXISTS public.get_damage_totals();
CREATE OR REPLACE FUNCTION public.get_damage_totals()
RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, verified integer, areas integer, images integer, reports_with_photos integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(*) FILTER (WHERE a.report_type = 'professional')::int AS verified,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') || '|' || COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido'))::int AS areas,
    COALESCE(SUM(a.photo_count), 0)::int AS images,
    COUNT(*) FILTER (WHERE a.photo_count > 0)::int AS reports_with_photos
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL;
$$;

DROP FUNCTION IF EXISTS public.get_damage_totals_filtered(text, text, date, date);
CREATE OR REPLACE FUNCTION public.get_damage_totals_filtered(
  _state text DEFAULT NULL,
  _municipality text DEFAULT NULL,
  _from date DEFAULT NULL,
  _to date DEFAULT NULL
)
RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, verified integer, areas integer, images integer, reports_with_photos integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(*) FILTER (WHERE a.report_type = 'professional')::int AS verified,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') || '|' || COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido'))::int AS areas,
    COALESCE(SUM(a.photo_count), 0)::int AS images,
    COUNT(*) FILTER (WHERE a.photo_count > 0)::int AS reports_with_photos
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL
    AND (_state IS NULL OR COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') = _state)
    AND (_municipality IS NULL OR COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido') = _municipality)
    AND (_from IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date >= _from)
    AND (_to IS NULL OR (a.created_at AT TIME ZONE 'America/New_York')::date <= _to);
$$;

-- 7. Lock down EXECUTE to match existing data-room/admin access pattern
REVOKE ALL ON FUNCTION public.get_photo_coverage_filtered(text, text, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_photo_aggregates_filtered(text, text, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_photo_timeseries_filtered(text, text, date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_photo_coverage_filtered(text, text, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_photo_aggregates_filtered(text, text, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_photo_timeseries_filtered(text, text, date, date) TO service_role;