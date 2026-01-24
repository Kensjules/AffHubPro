-- Recreate the shareasale_accounts_public view with proper security settings
-- This ensures the view respects RLS policies from the base table

DROP VIEW IF EXISTS public.shareasale_accounts_public;

CREATE VIEW public.shareasale_accounts_public 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
    id,
    user_id,
    merchant_id,
    is_connected,
    last_sync_at,
    sync_status,
    created_at,
    updated_at
FROM public.shareasale_accounts;

-- Grant access only to authenticated users
REVOKE ALL ON public.shareasale_accounts_public FROM anon, public;
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;