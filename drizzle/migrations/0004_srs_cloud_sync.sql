CREATE TABLE public.srs_cards (
  user_id uuid NOT NULL,
  card_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.srs_cards TO authenticated;
GRANT ALL ON public.srs_cards TO service_role;
ALTER TABLE public.srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own srs" ON public.srs_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own srs" ON public.srs_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own srs" ON public.srs_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own srs" ON public.srs_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);