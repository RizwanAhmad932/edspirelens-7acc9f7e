CREATE TABLE public.pyq_bank (
  id uuid primary key default gen_random_uuid(),
  exam text not null,
  chapter_key text not null,
  chapter_title text not null,
  page integer not null default 1,
  questions jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (exam, chapter_key, page)
);
GRANT SELECT ON public.pyq_bank TO anon;
GRANT SELECT ON public.pyq_bank TO authenticated;
GRANT ALL ON public.pyq_bank TO service_role;
ALTER TABLE public.pyq_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the shared PYQ bank" ON public.pyq_bank FOR SELECT USING (true);
CREATE INDEX pyq_bank_lookup_idx ON public.pyq_bank (exam, chapter_key, page);