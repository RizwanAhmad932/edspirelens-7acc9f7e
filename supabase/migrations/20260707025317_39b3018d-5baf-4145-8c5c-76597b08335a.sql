
-- 1) Trigger to force login_logs fields from auth session, preventing forgery
CREATE OR REPLACE FUNCTION public.enforce_login_log_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email text;
  meta_name text;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  jwt_email := (auth.jwt() ->> 'email');
  meta_name := COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'full_name'),
    (SELECT full_name FROM public.profiles WHERE id = auth.uid())
  );

  NEW.email := COALESCE(jwt_email, NEW.email);
  NEW.full_name := meta_name;
  -- Do not trust client-provided ip_address / user_agent beyond what the request headers carry
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_login_log_identity_trg ON public.login_logs;
CREATE TRIGGER enforce_login_log_identity_trg
BEFORE INSERT ON public.login_logs
FOR EACH ROW EXECUTE FUNCTION public.enforce_login_log_identity();

-- 2) Revoke EXECUTE from anon/public on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.activate_theme(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ad_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.add_xp(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_theme(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ad_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
