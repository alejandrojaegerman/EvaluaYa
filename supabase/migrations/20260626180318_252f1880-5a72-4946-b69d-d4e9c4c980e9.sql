ALTER TABLE public.volunteer_engineers
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Backfill: existing approved volunteers with a token keep working for 90 more days
UPDATE public.volunteer_engineers
SET token_expires_at = now() + interval '90 days'
WHERE status = 'approved' AND access_token IS NOT NULL AND token_expires_at IS NULL;