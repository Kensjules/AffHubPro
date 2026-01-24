-- Ensure RLS is definitely enabled on all tables (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareasale_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_cache ENABLE ROW LEVEL SECURITY;

-- Revoke all access from anon and public roles on base tables
REVOKE ALL ON public.profiles FROM anon, public;
REVOKE ALL ON public.shareasale_accounts FROM anon, public;
REVOKE ALL ON public.transactions_cache FROM anon, public;

-- Grant only authenticated users access to profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Grant only authenticated users access to shareasale_accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shareasale_accounts TO authenticated;

-- Grant only authenticated users access to transactions_cache
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions_cache TO authenticated;

-- Revoke access on the view from anon and public
REVOKE ALL ON public.shareasale_accounts_public FROM anon, public;

-- Grant only authenticated users SELECT on the view
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;

-- Force RLS for table owners as well (prevents owner bypass)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.shareasale_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_cache FORCE ROW LEVEL SECURITY;