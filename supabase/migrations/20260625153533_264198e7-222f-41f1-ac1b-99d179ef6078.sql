ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS municipality text;

-- Public, anonymized aggregate view. Runs as the view owner (security definer)
-- so anon can read aggregate counts WITHOUT any access to the locked base table.
-- Only non-identifying aggregate columns are exposed.
CREATE OR REPLACE VIEW public.public_damage_aggregates
WITH (security_invoker = off) AS
SELECT
  COALESCE(NULLIF(TRIM(state), ''), 'Desconocido') AS state,
  COALESCE(NULLIF(TRIM(municipality), ''), 'Desconocido') AS municipality,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE risk_level = 'green')::int AS green,
  COUNT(*) FILTER (WHERE risk_level = 'yellow')::int AS yellow,
  COUNT(*) FILTER (WHERE risk_level = 'red')::int AS red,
  MAX(created_at) AS last_report
FROM public.assessments
WHERE status = 'analyzed' AND risk_level IS NOT NULL
GROUP BY 1, 2;

GRANT SELECT ON public.public_damage_aggregates TO anon, authenticated;

-- Institution interest capture: anyone may submit, nobody may read publicly.
CREATE TABLE IF NOT EXISTS public.institution_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization text NOT NULL,
  contact_name text,
  email text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.institution_leads TO anon, authenticated;
GRANT ALL ON public.institution_leads TO service_role;

ALTER TABLE public.institution_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an institution lead"
  ON public.institution_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);