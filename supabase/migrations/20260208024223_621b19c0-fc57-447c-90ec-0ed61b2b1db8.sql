-- Add campaign_source column to affiliate_links table
ALTER TABLE public.affiliate_links 
ADD COLUMN IF NOT EXISTS campaign_source text;