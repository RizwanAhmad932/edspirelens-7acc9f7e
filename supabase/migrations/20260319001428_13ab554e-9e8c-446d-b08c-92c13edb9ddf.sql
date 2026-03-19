
CREATE TABLE public.app_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active themes" ON public.app_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage themes" ON public.app_themes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert all festival themes
INSERT INTO public.app_themes (theme_name, is_active) VALUES
  ('none', true),
  ('republic_day', false),
  ('eid', false),
  ('diwali', false),
  ('dussehra', false),
  ('holi', false),
  ('christmas', false);

-- Function to ensure only one theme is active at a time
CREATE OR REPLACE FUNCTION public.activate_theme(_theme_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.app_themes SET is_active = false WHERE is_active = true;
  UPDATE public.app_themes SET is_active = true WHERE theme_name = _theme_name;
END;
$$;
