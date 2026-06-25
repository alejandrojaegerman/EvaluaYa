CREATE TABLE public.seismic_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  grid jsonb NOT NULL,
  bbox jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.seismic_events TO service_role;

ALTER TABLE public.seismic_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: reads happen only through the
-- server function using the service role. Locked by default.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_seismic_events_updated_at
BEFORE UPDATE ON public.seismic_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one active event at a time.
CREATE UNIQUE INDEX seismic_events_single_active
ON public.seismic_events (is_active)
WHERE is_active = true;