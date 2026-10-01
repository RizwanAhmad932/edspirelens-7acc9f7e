CREATE TABLE public.ai_provider_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai','gemini','anthropic','openrouter','firecrawl')),
  label text not null default '',
  api_key text not null,
  model text not null default '',
  enabled boolean not null default true,
  priority integer not null default 10,
  last_status text,
  last_error text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.ai_provider_keys TO service_role;
ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pyq_questions (
  id uuid primary key default gen_random_uuid(),
  exam text not null,
  chapter_key text not null,
  chapter_title text not null,
  year text not null default '',
  marks numeric not null default 1,
  question text not null,
  answer text not null default '',
  type text not null default '',
  topic text not null default '',
  paper text not null default '',
  source_url text not null default '',
  source_id uuid,
  confidence integer not null default 80,
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  unique (exam, chapter_key, question)
);
GRANT SELECT ON public.pyq_questions TO anon, authenticated;
GRANT ALL ON public.pyq_questions TO service_role;
ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read indexed PYQs" ON public.pyq_questions FOR SELECT USING (true);
CREATE INDEX pyq_questions_lookup_idx ON public.pyq_questions (exam, chapter_key);

CREATE TABLE public.pyq_sources (
  id uuid primary key default gen_random_uuid(),
  exam text not null,
  chapter_title text not null,
  kind text not null check (kind in ('link','pdf')),
  url text not null default '',
  file_name text not null default '',
  status text not null default 'pending',
  questions_found integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.pyq_sources TO service_role;
ALTER TABLE public.pyq_sources ENABLE ROW LEVEL SECURITY;