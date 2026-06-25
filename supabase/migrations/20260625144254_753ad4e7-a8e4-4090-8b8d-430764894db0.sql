CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  language text NOT NULL DEFAULT 'es',
  property jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_result jsonb,
  risk_level text,
  status text NOT NULL DEFAULT 'draft'
);

GRANT ALL ON public.assessments TO service_role;

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: all access is brokered through server functions
-- using the service role, gated by an unguessable public_id. This keeps
-- address and assessment data private (no enumeration via the Data API).

CREATE INDEX idx_assessments_public_id ON public.assessments (public_id);