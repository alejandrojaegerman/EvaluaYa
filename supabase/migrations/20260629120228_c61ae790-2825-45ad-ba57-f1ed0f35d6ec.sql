DROP FUNCTION IF EXISTS public.get_damage_totals();

CREATE OR REPLACE FUNCTION public.get_damage_totals()
 RETURNS TABLE(total integer, green integer, yellow integer, orange integer, red integer, verified integer, areas integer, images integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE a.risk_level = 'green')::int AS green,
    COUNT(*) FILTER (WHERE a.risk_level = 'yellow')::int AS yellow,
    COUNT(*) FILTER (WHERE a.risk_level = 'orange')::int AS orange,
    COUNT(*) FILTER (WHERE a.risk_level = 'red')::int AS red,
    COUNT(*) FILTER (WHERE a.report_type = 'professional')::int AS verified,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(a.state), ''), 'Desconocido') || '|' || COALESCE(NULLIF(TRIM(a.municipality), ''), 'Desconocido'))::int AS areas,
    COALESCE((
      SELECT SUM(jsonb_array_length(COALESCE(ans->'photoPaths', '[]'::jsonb)))
      FROM public.assessments a2
      CROSS JOIN LATERAL jsonb_array_elements(a2.answers) AS ans
      WHERE a2.status = 'analyzed' AND a2.risk_level IS NOT NULL
        AND jsonb_typeof(a2.answers) = 'array'
    ), 0)::int AS images
  FROM public.assessments a
  WHERE a.status = 'analyzed' AND a.risk_level IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.get_damage_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_damage_totals() TO service_role;