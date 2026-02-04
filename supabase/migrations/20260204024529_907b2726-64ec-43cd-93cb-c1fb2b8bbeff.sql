-- Create affiliate_links table for link health monitoring
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  merchant_name TEXT,
  network TEXT NOT NULL CHECK (network IN ('shareasale', 'awin', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'broken', 'recovered', 'ignored')),
  last_checked_at TIMESTAMP WITH TIME ZONE,
  http_status_code INTEGER,
  recovery_suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Force RLS for all roles
ALTER TABLE public.affiliate_links FORCE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own affiliate links"
ON public.affiliate_links
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate links"
ON public.affiliate_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate links"
ON public.affiliate_links
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affiliate links"
ON public.affiliate_links
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_affiliate_links_updated_at
BEFORE UPDATE ON public.affiliate_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_affiliate_links_user_id ON public.affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_status ON public.affiliate_links(status);
CREATE INDEX idx_affiliate_links_network ON public.affiliate_links(network);