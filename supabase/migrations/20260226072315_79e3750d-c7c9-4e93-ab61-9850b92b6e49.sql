
-- 1. Add notes column to video_analyses (notes aren't being persisted)
ALTER TABLE public.video_analyses ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]'::jsonb;

-- 2. Create app_role enum and user_roles table for admin
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. Login logs table
CREATE TABLE public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login logs" ON public.login_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own login logs" ON public.login_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. User XP and avatar system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_avatar text DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_avatars jsonb DEFAULT '["default"]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_study_minutes integer DEFAULT 0;

-- 5. Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
