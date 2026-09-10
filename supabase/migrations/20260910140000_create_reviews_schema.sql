-- Aeria Trois: customer reviews schema with RLS and rate limiting

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating SMALLINT NOT NULL,
  name TEXT NOT NULL,
  opinion TEXT NOT NULL,
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  client_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT reviews_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 120),
  CONSTRAINT reviews_opinion_length CHECK (char_length(opinion) >= 20 AND char_length(opinion) <= 2000),
  CONSTRAINT reviews_privacy_check CHECK (privacy_accepted IS TRUE),
  CONSTRAINT reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

COMMENT ON TABLE public.reviews IS 'Customer reviews submitted via the website review form.';
COMMENT ON COLUMN public.reviews.client_key IS 'SHA-256 hash of client IP + daily salt. Set server-side. Not PII.';
COMMENT ON COLUMN public.reviews.status IS 'Moderation status. Only approved reviews are publicly visible.';

CREATE INDEX reviews_status_created_at_idx ON public.reviews (status, created_at DESC);
CREATE INDEX reviews_client_key_created_at_idx ON public.reviews (client_key, created_at DESC);

CREATE TABLE public.review_submission_attempts (
  id BIGSERIAL PRIMARY KEY,
  client_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.review_submission_attempts IS 'Internal rate-limit ledger. RLS enabled with no policies: only service role and SECURITY DEFINER functions may access.';

CREATE INDEX review_submission_attempts_client_key_created_at_idx
  ON public.review_submission_attempts (client_key, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submission_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select_approved
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sanitize_review_text(p_value TEXT, p_allow_newlines BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v TEXT;
BEGIN
  v := coalesce(p_value, '');
  v := regexp_replace(v, '\x00', '', 'g');
  v := regexp_replace(v, '<[^>]*>', '', 'g');
  v := regexp_replace(v, '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');

  IF NOT p_allow_newlines THEN
    v := regexp_replace(v, E'[\r\n]+', ' ', 'g');
  ELSE
    v := regexp_replace(v, E'\r\n?', E'\n', 'g');
    v := regexp_replace(v, E'\n{3,}', E'\n\n', 'g');
  END IF;

  v := regexp_replace(v, '[^\S\n]+', ' ', 'g');
  RETURN trim(v);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_review(
  p_rating SMALLINT,
  p_name TEXT,
  p_opinion TEXT,
  p_privacy_accepted BOOLEAN,
  p_client_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_opinion TEXT;
  v_recent_count INT;
  v_global_count INT;
  v_id UUID;
BEGIN
  IF p_client_key IS NULL OR p_client_key !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_client_key' USING ERRCODE = 'P0001';
  END IF;

  IF p_privacy_accepted IS NOT TRUE THEN
    RAISE EXCEPTION 'privacy_not_accepted' USING ERRCODE = 'P0001';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid_rating' USING ERRCODE = 'P0001';
  END IF;

  v_name := public.sanitize_review_text(p_name, false);
  v_opinion := public.sanitize_review_text(p_opinion, true);

  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = 'P0001';
  END IF;

  IF char_length(v_opinion) < 20 OR char_length(v_opinion) > 2000 THEN
    RAISE EXCEPTION 'invalid_opinion' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_recent_count
  FROM public.review_submission_attempts
  WHERE client_key = p_client_key
    AND created_at > timezone('utc', now()) - interval '1 hour';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_global_count
  FROM public.review_submission_attempts
  WHERE created_at > timezone('utc', now()) - interval '1 hour';

  IF v_global_count >= 100 THEN
    RAISE EXCEPTION 'rate_limit_global' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reviews
    WHERE client_key = p_client_key
      AND name = v_name
      AND opinion = v_opinion
      AND created_at > timezone('utc', now()) - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'duplicate_review' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.review_submission_attempts (client_key) VALUES (p_client_key);

  INSERT INTO public.reviews (rating, name, opinion, privacy_accepted, status, client_key)
  VALUES (p_rating, v_name, v_opinion, true, 'pending', p_client_key)
  RETURNING id INTO v_id;

  DELETE FROM public.review_submission_attempts
  WHERE created_at < timezone('utc', now()) - interval '48 hours';

  RETURN v_id;
END;
$$;

REVOKE ALL ON TABLE public.review_submission_attempts FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_review(SMALLINT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;
