
-- Better leveling curve: level = floor(sqrt(xp/50)) + 1
-- L1: 0-49xp, L2: 50-199, L3: 200-449, L4: 450-799, L5: 800-1249 ...
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_xp integer;
  new_xp integer;
  new_level integer;
BEGIN
  SELECT xp INTO current_xp FROM profiles WHERE id = _user_id;
  new_xp := GREATEST(0, COALESCE(current_xp, 0) + _amount);
  new_level := GREATEST(1, FLOOR(SQRT(new_xp::numeric / 50)) + 1);
  UPDATE profiles
  SET xp = new_xp, level = new_level, updated_at = now()
  WHERE id = _user_id;
END;
$function$;
