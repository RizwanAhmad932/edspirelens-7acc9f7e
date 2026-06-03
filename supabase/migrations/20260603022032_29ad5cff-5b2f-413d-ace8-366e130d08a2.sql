
-- 1) add_xp: require ownership
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_xp integer;
  new_xp integer;
  new_level integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  SELECT xp INTO current_xp FROM profiles WHERE id = _user_id;
  new_xp := GREATEST(0, COALESCE(current_xp, 0) + _amount);
  new_level := GREATEST(1, FLOOR(SQRT(new_xp::numeric / 50)) + 1);
  UPDATE profiles
  SET xp = new_xp, level = new_level, updated_at = now()
  WHERE id = _user_id;
END;
$$;

-- 2) activate_theme: require admin
CREATE OR REPLACE FUNCTION public.activate_theme(_theme_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;
  UPDATE public.app_themes SET is_active = false WHERE is_active = true;
  UPDATE public.app_themes SET is_active = true WHERE theme_name = _theme_name;
END;
$$;

-- 3) get_ad_stats: require admin
CREATE OR REPLACE FUNCTION public.get_ad_stats()
RETURNS TABLE(ad_id uuid, views bigint, clicks bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;
  RETURN QUERY
    SELECT ae.ad_id,
           COUNT(*) FILTER (WHERE ae.event_type = 'view') AS views,
           COUNT(*) FILTER (WHERE ae.event_type = 'click') AS clicks
    FROM public.ad_events ae
    GROUP BY ae.ad_id;
END;
$$;

-- 4) Revoke EXECUTE on SECURITY DEFINER funcs from anon; keep authenticated
REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.activate_theme(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ad_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_xp(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_theme(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ad_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 5) login_logs: restrict insert to authenticated users only
DROP POLICY IF EXISTS "Users can insert own login logs" ON public.login_logs;
CREATE POLICY "Users can insert own login logs"
ON public.login_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6) user_roles: explicit restrictive policies blocking client mutations
CREATE POLICY "No client inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "No client deletes on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);
