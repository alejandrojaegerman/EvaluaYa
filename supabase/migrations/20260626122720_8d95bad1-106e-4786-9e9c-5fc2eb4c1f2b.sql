-- =====================================================================
-- Volunteer engineers
-- =====================================================================
CREATE TABLE public.volunteer_engineers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization text,
  whatsapp text NOT NULL,
  email text,
  states text[] NOT NULL DEFAULT '{}',
  specialization text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  access_token uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT volunteer_engineers_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

GRANT INSERT ON public.volunteer_engineers TO anon, authenticated;
GRANT ALL ON public.volunteer_engineers TO service_role;

ALTER TABLE public.volunteer_engineers ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a volunteer signup (validated). Always lands as 'pending'
-- with no access token until an admin approves through trusted server code.
CREATE POLICY "Anyone can submit a volunteer signup"
ON public.volunteer_engineers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(TRIM(BOTH FROM name)) > 0
  AND length(TRIM(BOTH FROM whatsapp)) > 0
  AND array_length(states, 1) >= 1
  AND status = 'pending'
  AND access_token IS NULL
);

-- No public read of the raw table — listings are brokered server-side.
CREATE POLICY "No public read of volunteer engineers"
ON public.volunteer_engineers
FOR SELECT
TO anon, authenticated
USING (false);

CREATE TRIGGER update_volunteer_engineers_updated_at
BEFORE UPDATE ON public.volunteer_engineers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Help requests (resident callback opt-ins)
-- =====================================================================
CREATE TABLE public.help_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  assessment_public_id text,
  state text,
  municipality text,
  risk_level text,
  resident_whatsapp text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open',
  claimed_by uuid REFERENCES public.volunteer_engineers(id) ON DELETE SET NULL,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT help_requests_status_check
    CHECK (status IN ('open', 'claimed', 'closed')),
  CONSTRAINT help_requests_risk_check
    CHECK (risk_level IS NULL OR risk_level IN ('green', 'yellow', 'red'))
);

GRANT INSERT ON public.help_requests TO anon, authenticated;
GRANT ALL ON public.help_requests TO service_role;

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Residents may submit a callback request (validated). No public reads —
-- resident contact details are only surfaced to approved engineers server-side.
CREATE POLICY "Anyone can submit a help request"
ON public.help_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(TRIM(BOTH FROM resident_whatsapp)) > 0
  AND status = 'open'
  AND claimed_by IS NULL
);

CREATE POLICY "No public read of help requests"
ON public.help_requests
FOR SELECT
TO anon, authenticated
USING (false);

CREATE TRIGGER update_help_requests_updated_at
BEFORE UPDATE ON public.help_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX help_requests_status_idx ON public.help_requests (status, created_at DESC);
CREATE INDEX volunteer_engineers_status_idx ON public.volunteer_engineers (status);

-- =====================================================================
-- Brokered read helpers (SECURITY DEFINER) — used by trusted server code
-- =====================================================================

-- Approved engineers covering a given estado (safe columns only).
CREATE OR REPLACE FUNCTION public.get_approved_engineers(_state text)
RETURNS TABLE (
  id uuid,
  name text,
  organization text,
  whatsapp text,
  states text[],
  specialization text,
  covers_state boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.name,
    e.organization,
    e.whatsapp,
    e.states,
    e.specialization,
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
$$;
