CREATE OR REPLACE FUNCTION public.get_admin_assessment_timeseries()
 RETURNS TABLE(day date, total integer, green integer, yellow integer, red integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (created_at AT TIME ZONE 'America/New_York')::date AS day,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE risk_level = 'green')::int,
    COUNT(*) FILTER (WHERE risk_level = 'yellow')::int,
    COUNT(*) FILTER (WHERE risk_level = 'red')::int
  FROM public.assessments
  WHERE created_at >= now() - interval '30 days'
  GROUP BY 1
  ORDER BY 1;
$function$;