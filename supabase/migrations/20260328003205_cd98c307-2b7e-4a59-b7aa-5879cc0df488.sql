CREATE TABLE public.custom_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.custom_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands" ON public.custom_brands
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brands" ON public.custom_brands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own brands" ON public.custom_brands
  FOR DELETE TO authenticated USING (auth.uid() = user_id);