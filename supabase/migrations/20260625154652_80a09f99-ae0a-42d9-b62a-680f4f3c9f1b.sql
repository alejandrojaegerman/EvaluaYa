-- Fix 1 (institution_leads_missing_select_rls): block public reads of lead PII.
-- Access is brokered through server functions using the service role, so anon/authenticated
-- never need direct read access. Revoke read grants and add an explicit deny-all SELECT policy.
REVOKE SELECT, UPDATE, DELETE ON public.institution_leads FROM anon, authenticated;

CREATE POLICY "No public read of institution leads"
ON public.institution_leads
FOR SELECT
TO anon, authenticated
USING (false);

-- Fix 2 (SUPA_rls_policy_always_true): replace the permissive WITH CHECK (true) INSERT
-- policy with a validated check so submissions must include a non-empty organization and a
-- plausibly-formatted email, while still allowing anonymous lead submissions.
DROP POLICY IF EXISTS "Anyone can submit an institution lead" ON public.institution_leads;

CREATE POLICY "Anyone can submit an institution lead"
ON public.institution_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(organization)) > 0
  AND length(trim(email)) > 0
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);