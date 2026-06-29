REVOKE ALL ON FUNCTION public.get_damage_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_damage_totals_filtered(text, text, date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_damage_totals() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_damage_totals_filtered(text, text, date, date) TO service_role;