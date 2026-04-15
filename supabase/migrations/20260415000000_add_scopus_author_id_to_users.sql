ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS scopus_author_id text;
