
REVOKE ALL ON FUNCTION public.get_admin_help_requests(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_matching_progress() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_requests_needing_action() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_help_requests(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_matching_progress() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_requests_needing_action() TO service_role;
