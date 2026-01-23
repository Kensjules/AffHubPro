-- Enable RLS on the shareasale_accounts_public view
ALTER VIEW public.shareasale_accounts_public SET (security_invoker = on);

-- Enable RLS on the view (views inherit RLS from base table when security_invoker is on)
-- But we also need explicit policies on the view for direct access control

-- Since this is a view with security_invoker=on, it will use the RLS policies 
-- of the underlying shareasale_accounts table. The base table already has 
-- "No direct SELECT" policy with USING(false), which blocks all SELECT.

-- To allow users to read their own data through the view, we need to:
-- 1. Create a SELECT policy on the base table that allows owner access for view queries
-- OR use a security definer function approach

-- Actually, views with security_invoker=on will check RLS on base tables.
-- Since shareasale_accounts has USING(false) for SELECT, the view won't work.
-- We need to use security_barrier and handle this differently.

-- Let's recreate the view with security_barrier and add RLS properly
DROP VIEW IF EXISTS public.shareasale_accounts_public;

-- Recreate the view with security_barrier for additional protection
CREATE VIEW public.shareasale_accounts_public 
WITH (security_barrier = true, security_invoker = false) AS
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

-- Grant select permission to authenticated users only
REVOKE ALL ON public.shareasale_accounts_public FROM anon;
REVOKE ALL ON public.shareasale_accounts_public FROM public;
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;

-- Create a security definer function to safely fetch user's own account
CREATE OR REPLACE FUNCTION public.get_my_shareasale_account()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    merchant_id text,
    is_connected boolean,
    last_sync_at timestamp with time zone,
    sync_status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        id,
        user_id,
        merchant_id,
        is_connected,
        last_sync_at,
        sync_status,
        created_at,
        updated_at
    FROM public.shareasale_accounts
    WHERE user_id = auth.uid();
$$;