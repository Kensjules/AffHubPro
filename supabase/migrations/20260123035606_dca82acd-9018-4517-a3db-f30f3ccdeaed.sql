-- Create a secure view for shareasale_accounts that hides sensitive credentials
-- This view will be used by client-side queries instead of the base table

-- First, create a view that excludes API credentials
CREATE VIEW public.shareasale_accounts_public
WITH (security_invoker = on) AS
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
-- Note: api_token_encrypted and api_secret_encrypted are intentionally excluded

-- Drop existing SELECT policy on base table and create restrictive one
DROP POLICY IF EXISTS "Users can view their own shareasale account" ON public.shareasale_accounts;

-- Create new restrictive SELECT policy that denies direct access
-- Edge functions use service_role which bypasses RLS
CREATE POLICY "No direct SELECT on shareasale_accounts"
  ON public.shareasale_accounts
  FOR SELECT
  TO authenticated
  USING (false);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.shareasale_accounts_public TO authenticated;

-- Enable RLS on the view implicitly via security_invoker
-- The view will respect the underlying table's RLS policies for INSERT/UPDATE/DELETE
-- but since we set SELECT to false, clients can only read via this safe view