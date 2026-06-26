CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  email text,
  page text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(message) BETWEEN 1 AND 2000
    AND (email IS NULL OR char_length(email) <= 255)
  );