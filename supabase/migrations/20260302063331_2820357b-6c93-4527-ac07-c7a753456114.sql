
-- 1. Add registration fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_class text,
ADD COLUMN IF NOT EXISTS board text,
ADD COLUMN IF NOT EXISTS target_exam text,
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Create ads table for admin ad management
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ad_type text NOT NULL DEFAULT 'banner', -- 'banner', 'popup', 'video'
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image', -- 'image', 'video'
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  placement text NOT NULL DEFAULT 'home', -- 'home', 'popup', 'between_content'
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can view active ads
CREATE POLICY "Users can view active ads" ON public.ads FOR SELECT
  TO authenticated USING (is_active = true);

-- 3. Create ad_events table for tracking clicks/views
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL, -- 'view', 'click'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert ad events" ON public.ad_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view ad events" ON public.ad_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create challenges table
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_type text NOT NULL DEFAULT 'xp', -- 'xp', 'avatar', 'costume'
  reward_value text NOT NULL, -- XP amount or avatar/costume id
  goal_type text NOT NULL, -- 'study_minutes', 'videos_analyzed', 'quizzes_completed', 'app_usage_minutes'
  goal_target integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage challenges" ON public.challenges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active challenges" ON public.challenges FOR SELECT
  TO authenticated USING (is_active = true);

-- 5. User challenge progress
CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress" ON public.user_challenges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress" ON public.user_challenges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenges FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- 6. Create storage bucket for ad media
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-media', 'ad-media', true);

CREATE POLICY "Admins can upload ad media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ad-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad media" ON storage.objects FOR UPDATE
  USING (bucket_id = 'ad-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad media" ON storage.objects FOR DELETE
  USING (bucket_id = 'ad-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view ad media" ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-media');

-- Trigger for ads updated_at
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
