CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('milestone','insight','product_update')),
  body text NOT NULL CHECK (char_length(body) <= 280),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','posted','failed')),
  dedupe_key text UNIQUE,
  x_post_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  posted_at timestamptz
);

GRANT ALL ON public.social_posts TO service_role;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
-- No policies: table is fully private. All access is via the service role
-- (admin server functions + cron jobs), never the public app.

CREATE INDEX social_posts_status_created_idx
  ON public.social_posts (status, created_at);

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Anonymized weekly insight source (last 7 days). Counts only.
CREATE OR REPLACE FUNCTION public.get_weekly_insight()
RETURNS TABLE(
  total integer,
  green integer,
  yellow integer,
  red integer,
  top_state text,
  top_state_total integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH wk AS (
    SELECT
      COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') AS st,
      a.risk_level
    FROM public.assessments a
    WHERE a.status = 'analyzed'
      AND a.risk_level IS NOT NULL
      AND a.created_at >= now() - interval '7 days'
  ),
  tops AS (
    SELECT st, COUNT(*)::int AS c
    FROM wk
    WHERE st <> 'Desconocido'
    GROUP BY st
    ORDER BY c DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::int FROM wk),
    (SELECT COUNT(*) FILTER (WHERE risk_level = 'green')::int FROM wk),
    (SELECT COUNT(*) FILTER (WHERE risk_level = 'yellow')::int FROM wk),
    (SELECT COUNT(*) FILTER (WHERE risk_level = 'red')::int FROM wk),
    (SELECT st FROM tops),
    (SELECT c FROM tops);
$function$;

REVOKE ALL ON FUNCTION public.get_weekly_insight() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_insight() TO service_role;