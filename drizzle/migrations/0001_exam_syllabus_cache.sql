CREATE TABLE public.exam_syllabus (
  exam text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.exam_syllabus TO anon, authenticated;
GRANT ALL ON public.exam_syllabus TO service_role;
ALTER TABLE public.exam_syllabus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exam syllabus" ON public.exam_syllabus FOR SELECT USING (true);