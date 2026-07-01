ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS resident_name text,
  ADD COLUMN IF NOT EXISTS resident_address text;