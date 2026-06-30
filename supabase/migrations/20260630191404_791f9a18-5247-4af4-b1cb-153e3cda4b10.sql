ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS legal_ack_at timestamptz,
  ADD COLUMN IF NOT EXISTS legal_version text,
  ADD COLUMN IF NOT EXISTS resident_name text,
  ADD COLUMN IF NOT EXISTS resident_contact text,
  ADD COLUMN IF NOT EXISTS resident_contact_type text,
  ADD COLUMN IF NOT EXISTS parroquia text;