CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  brand_source text NOT NULL,
  category text NOT NULL DEFAULT 'direct_brand',
  payout_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.payouts FROM anon, public;
GRANT SELECT, INSERT, DELETE ON public.payouts TO authenticated;

CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payouts" ON public.payouts FOR DELETE TO authenticated USING (auth.uid() = user_id);