GRANT SELECT ON public.app_themes TO anon;
CREATE POLICY "Public can view active festival theme" ON public.app_themes FOR SELECT TO anon USING (is_active = true);