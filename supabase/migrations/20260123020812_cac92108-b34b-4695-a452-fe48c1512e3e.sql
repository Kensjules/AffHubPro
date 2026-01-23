-- Ensure RLS is enabled on all tables (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareasale_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own shareasale account" ON public.shareasale_accounts;
DROP POLICY IF EXISTS "Users can insert their own shareasale account" ON public.shareasale_accounts;
DROP POLICY IF EXISTS "Users can update their own shareasale account" ON public.shareasale_accounts;
DROP POLICY IF EXISTS "Users can delete their own shareasale account" ON public.shareasale_accounts;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions_cache;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions_cache;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions_cache;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions_cache;

-- Recreate policies as PERMISSIVE (default) for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Recreate policies as PERMISSIVE for shareasale_accounts
CREATE POLICY "Users can view their own shareasale account"
ON public.shareasale_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shareasale account"
ON public.shareasale_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shareasale account"
ON public.shareasale_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shareasale account"
ON public.shareasale_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Recreate policies as PERMISSIVE for transactions_cache
CREATE POLICY "Users can view their own transactions"
ON public.transactions_cache FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions_cache FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions_cache FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions_cache FOR DELETE
TO authenticated
USING (auth.uid() = user_id);