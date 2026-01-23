-- Drop the security definer view and recreate with security invoker
DROP VIEW IF EXISTS public.shareasale_accounts_public;

-- Recreate view with security_invoker = true so it uses caller's RLS
CREATE VIEW public.shareasale_accounts_public 
WITH (security_invoker = true) AS
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

-- Drop the old restrictive SELECT policy that blocks everything
DROP POLICY IF EXISTS "No direct SELECT on shareasale_accounts" ON public.shareasale_accounts;

-- Create a new SELECT policy that only allows users to see their own account
-- This will apply to both direct queries AND through the view (with security_invoker)
CREATE POLICY "Users can view their own shareasale account via view"
ON public.shareasale_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Revoke direct access to the base table from anon users
REVOKE ALL ON public.shareasale_accounts FROM anon;

-- Grant select on view to authenticated users only
REVOKE ALL ON public.shareasale_accounts_public FROM anon;
REVOKE ALL ON public.shareasale_accounts_public FROM public;
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;

-- The get_my_shareasale_account function is now redundant but keep it for backward compatibility
-- It now just uses the RLS policy instead of bypassing it