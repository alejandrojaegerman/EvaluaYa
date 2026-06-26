ALTER TABLE public.volunteer_engineers
  ADD COLUMN IF NOT EXISTS volunteer_type text NOT NULL DEFAULT 'individual';

ALTER TABLE public.volunteer_engineers
  DROP CONSTRAINT IF EXISTS volunteer_engineers_volunteer_type_check;

ALTER TABLE public.volunteer_engineers
  ADD CONSTRAINT volunteer_engineers_volunteer_type_check
  CHECK (volunteer_type IN ('individual', 'organization'));

DROP FUNCTION IF EXISTS public.get_approved_engineers(text);

CREATE OR REPLACE FUNCTION public.get_approved_engineers(_state text)
 RETURNS TABLE(id uuid, name text, organization text, whatsapp text, states text[], specialization text, volunteer_type text, covers_state boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    e.name,
    e.organization,
    e.whatsapp,
    e.states,
    e.specialization,
    e.volunteer_type,
    (_state IS NOT NULL AND _state = ANY (e.states)) AS covers_state
  FROM public.volunteer_engineers e
  WHERE e.status = 'approved'
    AND (
      _state IS NULL
      OR _state = ANY (e.states)
      OR array_length(e.states, 1) IS NULL
      OR e.states = '{}'
    )
  ORDER BY covers_state DESC, e.created_at ASC;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_approved_engineers(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_engineers(text) TO service_role;