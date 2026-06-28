-- 1. Revoke EXECUTE on all SECURITY DEFINER functions in public schema
--    from anon and authenticated. These are only ever invoked server-side
--    via the service role (which bypasses these grants).
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, authenticated, PUBLIC;',
      fn.schema_name, fn.func_name, fn.args
    );
  END LOOP;
END $$;

-- 2. Lock down funnel_events: writes/reads happen exclusively server-side via
--    the service role. Make the default-deny explicit at the grant level so
--    PostgREST (anon/authenticated) cannot reach the table at all.
REVOKE ALL ON public.funnel_events FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.funnel_events TO service_role;

-- 3. Engineer credential documents: explicit storage.objects policies that
--    deny anon/authenticated access to the private 'engineer-credentials'
--    bucket. All legitimate access is via service-role server functions
--    (which bypass RLS). These policies document and enforce intent.
DROP POLICY IF EXISTS "engineer_credentials_no_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "engineer_credentials_no_anon_write" ON storage.objects;

CREATE POLICY "engineer_credentials_deny_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id <> 'engineer-credentials');

CREATE POLICY "engineer_credentials_deny_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id <> 'engineer-credentials');

CREATE POLICY "engineer_credentials_deny_update"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id <> 'engineer-credentials')
  WITH CHECK (bucket_id <> 'engineer-credentials');

CREATE POLICY "engineer_credentials_deny_delete"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id <> 'engineer-credentials');