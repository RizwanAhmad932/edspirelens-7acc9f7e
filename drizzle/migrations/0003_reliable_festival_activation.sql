CREATE OR REPLACE FUNCTION public.activate_theme(_theme_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;
  IF _theme_name IS NULL OR _theme_name NOT IN ('none','republic_day','independence_day','eid','diwali','dussehra','holi','navratri','christmas','new_year') THEN
    RAISE EXCEPTION 'Unsupported festival theme';
  END IF;
  PERFORM pg_advisory_xact_lock(682041);
  UPDATE public.app_themes SET is_active = false WHERE is_active = true;
  IF NOT EXISTS (SELECT 1 FROM public.app_themes WHERE theme_name = _theme_name) THEN
    INSERT INTO public.app_themes (theme_name, is_active) VALUES (_theme_name, true);
  ELSE
    UPDATE public.app_themes SET is_active = true WHERE id = (SELECT id FROM public.app_themes WHERE theme_name = _theme_name ORDER BY created_at LIMIT 1);
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.activate_theme(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_theme(text) TO authenticated;