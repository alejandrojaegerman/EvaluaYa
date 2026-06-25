CREATE TABLE public.analysis_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_key text NOT NULL UNIQUE,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.analysis_rate_limits TO service_role;

ALTER TABLE public.analysis_rate_limits ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: this table is written and read only by
-- server-side code using the service role (which bypasses RLS). All other
-- roles are default-denied.