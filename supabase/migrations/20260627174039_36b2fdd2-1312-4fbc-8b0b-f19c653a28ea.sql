CREATE TABLE public.funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  step text NOT NULL,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.funnel_events TO service_role;

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
-- No policies: locked down. Only the service-role (admin/server) layer can read or write.

CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at);
CREATE INDEX idx_funnel_events_step_created_at ON public.funnel_events (step, created_at);

CREATE OR REPLACE FUNCTION public.get_funnel_metrics(_window_hours integer DEFAULT 48)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH w AS (
    SELECT GREATEST(1, LEAST(COALESCE(_window_hours, 48), 720)) AS h
  ),
  ev AS (
    SELECT step, device_id, created_at
    FROM public.funnel_events, w
    WHERE created_at >= now() - (w.h || ' hours')::interval
  ),
  steps AS (
    SELECT step,
           COUNT(DISTINCT device_id)::int AS devices,
           COUNT(*)::int AS events
    FROM ev
    GROUP BY step
  ),
  hourly AS (
    SELECT
      to_char(date_trunc('hour', created_at AT TIME ZONE 'America/New_York'), 'YYYY-MM-DD"T"HH24:00') AS hour,
      COUNT(DISTINCT device_id) FILTER (WHERE step = 'property_started')::int AS started,
      COUNT(DISTINCT device_id) FILTER (WHERE step = 'result_reached')::int AS result
    FROM ev
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'windowHours', (SELECT h FROM w),
    'steps', COALESCE((SELECT jsonb_agg(jsonb_build_object('step', step, 'devices', devices, 'events', events)) FROM steps), '[]'::jsonb),
    'hourly', COALESCE((SELECT jsonb_agg(jsonb_build_object('hour', hour, 'started', started, 'result', result) ORDER BY hour) FROM hourly), '[]'::jsonb)
  );
$function$;

REVOKE ALL ON FUNCTION public.get_funnel_metrics(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel_metrics(integer) TO service_role;