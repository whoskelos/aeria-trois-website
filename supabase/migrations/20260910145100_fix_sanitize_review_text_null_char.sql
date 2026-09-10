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
