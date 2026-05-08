
-- App settings (single row keyed by 'global')
CREATE TABLE public.app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  logo_light_url text,
  logo_dark_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage app_settings" ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Quiz attempts for analytics
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid,
  video_title text,
  topic text,
  question text NOT NULL,
  selected_answer text,
  correct_answer text,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id, created_at DESC);
CREATE INDEX idx_quiz_attempts_topic ON public.quiz_attempts(user_id, topic);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for app logos
INSERT INTO storage.buckets (id, name, public) VALUES ('app-logos', 'app-logos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read app-logos" ON storage.objects FOR SELECT
  USING (bucket_id = 'app-logos');
CREATE POLICY "Admins upload app-logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update app-logos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete app-logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'app-logos' AND has_role(auth.uid(), 'admin'::app_role));
