
CREATE TABLE public.app_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_url text NOT NULL,
  app_url text NOT NULL,
  category text NOT NULL DEFAULT 'Tools',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage app shortcuts"
  ON public.app_shortcuts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active shortcuts"
  ON public.app_shortcuts FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TRIGGER update_app_shortcuts_updated_at
  BEFORE UPDATE ON public.app_shortcuts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
  VALUES ('app-icons', 'app-icons', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read app icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-icons');

CREATE POLICY "Admins upload app icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update app icons"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete app icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'app-icons' AND has_role(auth.uid(), 'admin'::app_role));
