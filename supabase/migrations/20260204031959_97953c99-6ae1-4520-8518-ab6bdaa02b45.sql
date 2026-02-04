-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.shareasale_accounts_public;

-- Recreate view with security_invoker to inherit RLS from base table
CREATE VIEW public.shareasale_accounts_public
WITH (security_invoker = on, security_barrier = true) AS
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

-- Grant SELECT only to authenticated users (view inherits RLS from base table)
REVOKE ALL ON public.shareasale_accounts_public FROM anon, public;
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;