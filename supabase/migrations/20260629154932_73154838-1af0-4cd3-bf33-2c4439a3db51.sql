CREATE TABLE public.api_usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  filters jsonb,
  referer_host text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.api_usage_events TO service_role;

ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: writes happen via service role inside route
-- handlers; reads happen via the security-definer RPC below. The table is
-- intentionally inaccessible to anon/authenticated (same posture as funnel_events).

CREATE INDEX idx_api_usage_events_created_at ON public.api_usage_events (created_at DESC);
CREATE INDEX idx_api_usage_events_endpoint ON public.api_usage_events (endpoint);

CREATE OR REPLACE FUNCTION public.get_api_usage_metrics(_window_hours integer DEFAULT 168)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH w AS (
    SELECT GREATEST(1, LEAST(COALESCE(_window_hours, 168), 2160)) AS h
  ),
  ev AS (
    SELECT endpoint, filters, referer_host, created_at
    FROM public.api_usage_events, w
    WHERE created_at >= now() - (w.h || ' hours')::interval
  ),
  by_endpoint AS (
    SELECT endpoint, COUNT(*)::int AS calls
    FROM ev GROUP BY endpoint ORDER BY COUNT(*) DESC
  ),
  by_day AS (
    SELECT to_char((created_at AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS calls
    FROM ev GROUP BY 1 ORDER BY 1
  ),
  by_referer AS (
    SELECT COALESCE(NULLIF(TRIM(referer_host), ''), 'directo/desconocido') AS host,
           COUNT(*)::int AS calls
    FROM ev GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 8
  ),
  by_state AS (
    SELECT (filters->>'state') AS state, COUNT(*)::int AS calls
    FROM ev
    WHERE filters->>'state' IS NOT NULL AND TRIM(filters->>'state') <> ''
    GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 8
  )
  SELECT jsonb_build_object(
    'windowHours', (SELECT h FROM w),
    'total', (SELECT COUNT(*)::int FROM ev),
    'today', (SELECT COUNT(*)::int FROM ev
              WHERE (created_at AT TIME ZONE 'America/New_York')::date
                    = (now() AT TIME ZONE 'America/New_York')::date),
    'lastCall', (SELECT MAX(created_at) FROM ev),
    'byEndpoint', COALESCE((SELECT jsonb_agg(jsonb_build_object('endpoint', endpoint, 'calls', calls)) FROM by_endpoint), '[]'::jsonb),
    'byDay', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', day, 'calls', calls) ORDER BY day) FROM by_day), '[]'::jsonb),
    'byReferer', COALESCE((SELECT jsonb_agg(jsonb_build_object('host', host, 'calls', calls)) FROM by_referer), '[]'::jsonb),
    'byState', COALESCE((SELECT jsonb_agg(jsonb_build_object('state', state, 'calls', calls)) FROM by_state), '[]'::jsonb)
  );
$function$;

REVOKE ALL ON FUNCTION public.get_api_usage_metrics(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_usage_metrics(integer) TO service_role;