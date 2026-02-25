
-- Create video_analyses table (public, no auth required for now - we'll add auth later)
CREATE TABLE public.video_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  video_url TEXT NOT NULL,
  video_title TEXT NOT NULL DEFAULT 'Untitled Video',
  duration TEXT,
  summary JSONB DEFAULT '[]'::jsonb,
  transcript JSONB DEFAULT '[]'::jsonb,
  quiz JSONB DEFAULT '[]'::jsonb,
  quiz_score INTEGER,
  quiz_total INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert (no auth for MVP)
CREATE POLICY "Anyone can view analyses" ON public.video_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can create analyses" ON public.video_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update analyses" ON public.video_analyses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete analyses" ON public.video_analyses FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_video_analyses_updated_at
  BEFORE UPDATE ON public.video_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
