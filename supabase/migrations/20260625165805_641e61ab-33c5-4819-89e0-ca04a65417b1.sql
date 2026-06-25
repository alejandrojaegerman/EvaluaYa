ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS geo_inferred boolean NOT NULL DEFAULT false;