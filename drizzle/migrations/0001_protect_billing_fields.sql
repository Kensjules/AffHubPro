CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _role text := coalesce(auth.role(), current_setting('request.jwt.claims', true)::jsonb->>'role', '');
BEGIN
  IF (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
      OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id)
     AND _role IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'subscription_status and stripe_customer_id can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_fields();

ALTER POLICY "Users can update their own profile" ON public.profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
ALTER POLICY "Users can update their own affiliate links" ON public.affiliate_links USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own transactions" ON public.transactions_cache USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own integrations" ON public.user_integrations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own shareasale account" ON public.shareasale_accounts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);