-- Add optional ownership + device linkage to assessments so residents can
-- save and re-access their reports via a passwordless email account.
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS device_id text;

CREATE INDEX IF NOT EXISTS assessments_user_id_idx ON public.assessments (user_id);
CREATE INDEX IF NOT EXISTS assessments_device_id_idx ON public.assessments (device_id);

-- Authenticated residents can read only the reports they have claimed.
GRANT SELECT ON public.assessments TO authenticated;

DROP POLICY IF EXISTS "Owners can read their own assessments" ON public.assessments;
CREATE POLICY "Owners can read their own assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());