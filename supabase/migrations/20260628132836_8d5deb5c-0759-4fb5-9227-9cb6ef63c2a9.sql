
REVOKE EXECUTE ON FUNCTION public.get_requests_needing_action() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_engineer_stats(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_verified_engineers_public() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_matching_progress() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_help_requests(integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_requests_needing_action() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_engineer_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_verified_engineers_public() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_matching_progress() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_help_requests(integer) TO service_role;
