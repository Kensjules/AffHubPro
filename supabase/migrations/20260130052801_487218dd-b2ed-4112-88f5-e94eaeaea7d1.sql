-- Create table for storing user integration credentials
CREATE TABLE public.user_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    publisher_id TEXT,
    api_token_encrypted TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations FORCE ROW LEVEL SECURITY;

-- Revoke default permissions and grant only to authenticated users
REVOKE ALL ON public.user_integrations FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;

-- RLS Policies - users can only manage their own integrations
CREATE POLICY "Users can view their own integrations"
ON public.user_integrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
ON public.user_integrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
ON public.user_integrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
ON public.user_integrations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
BEFORE UPDATE ON public.user_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();