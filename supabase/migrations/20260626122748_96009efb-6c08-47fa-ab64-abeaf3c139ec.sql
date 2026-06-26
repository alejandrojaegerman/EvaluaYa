REVOKE EXECUTE ON FUNCTION public.get_approved_engineers(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_engineers(text) TO service_role;