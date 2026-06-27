CREATE OR REPLACE FUNCTION public.get_damage_timeseries()
 RETURNS TABLE(day date, total integer, green integer, yellow integer, orange integer, red integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (a.created_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red
  FROM public.assessments a
  WHERE a.status = 'analyzed'
    AND a.risk_level IS NOT NULL
    AND a.created_at >= now() - interval '90 days'
  GROUP BY 1
  ORDER BY 1;
$function$;

REVOKE ALL ON FUNCTION public.get_damage_timeseries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_damage_timeseries() TO anon, authenticated, service_role;