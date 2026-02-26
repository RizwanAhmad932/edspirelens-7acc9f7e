
-- Create function to add XP and auto-level up
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
BEGIN
  SELECT xp INTO current_xp FROM profiles WHERE id = _user_id;
  new_xp := COALESCE(current_xp, 0) + _amount;
  new_level := GREATEST(1, (new_xp / 200) + 1);
  
  UPDATE profiles 
  SET xp = new_xp, level = new_level, updated_at = now()
  WHERE id = _user_id;
END;
$$;
