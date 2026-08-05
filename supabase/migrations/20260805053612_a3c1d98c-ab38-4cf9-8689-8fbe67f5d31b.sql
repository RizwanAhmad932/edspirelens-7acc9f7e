-- Guard progression columns against direct client writes
CREATE OR REPLACE FUNCTION public.protect_profile_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- allow writes performed inside trusted SECURITY DEFINER routines / service role
  IF current_setting('app.progression_write', true) = 'on'
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.xp := OLD.xp;
  NEW.level := OLD.level;
  NEW.unlocked_avatars := OLD.unlocked_avatars;
  -- study time may only grow, and by at most 4 hours per update
  IF NEW.total_study_minutes IS DISTINCT FROM OLD.total_study_minutes THEN
    IF NEW.total_study_minutes < COALESCE(OLD.total_study_minutes, 0)
       OR NEW.total_study_minutes > COALESCE(OLD.total_study_minutes, 0) + 240 THEN
      NEW.total_study_minutes := OLD.total_study_minutes;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_progression_trg ON public.profiles;
CREATE TRIGGER protect_profile_progression_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_progression();

-- Clamp XP awards to a sane per-call range and mark the write as trusted
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_xp integer;
  new_xp integer;
  new_level integer;
  capped integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  capped := LEAST(GREATEST(COALESCE(_amount, 0), -100), 100);

  SELECT xp INTO current_xp FROM profiles WHERE id = _user_id;
  new_xp := GREATEST(0, COALESCE(current_xp, 0) + capped);
  new_level := GREATEST(1, FLOOR(SQRT(new_xp::numeric / 50)) + 1);

  PERFORM set_config('app.progression_write', 'on', true);
  UPDATE profiles
  SET xp = new_xp, level = new_level, updated_at = now()
  WHERE id = _user_id;
  PERFORM set_config('app.progression_write', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_progression() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_xp(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_xp(uuid, integer) TO authenticated;