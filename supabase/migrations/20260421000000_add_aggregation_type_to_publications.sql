ALTER TABLE public.publications
ADD COLUMN IF NOT EXISTS aggregation_type character varying(50);
