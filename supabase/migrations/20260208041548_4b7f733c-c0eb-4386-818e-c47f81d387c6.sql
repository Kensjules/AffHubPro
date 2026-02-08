-- Add tracking column for alert throttling
ALTER TABLE affiliate_links 
  ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ;

-- Create index for efficient querying of alert timestamps
CREATE INDEX IF NOT EXISTS idx_affiliate_links_last_alert 
  ON affiliate_links(last_alert_sent_at);