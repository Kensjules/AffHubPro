-- Add api_secret_encrypted column for platforms requiring separate key/secret
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS api_secret_encrypted TEXT;

-- Add index on integration_type for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON public.user_integrations(integration_type);

-- Add index on user_id + integration_type for common query pattern
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_type ON public.user_integrations(user_id, integration_type);