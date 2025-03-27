ALTER TABLE notices 
ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN importance TEXT NOT NULL DEFAULT 'NORMAL';

-- Update existing notices to have a default expiration of 7 days from now
UPDATE notices 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at = NOW() + INTERVAL '7 days'; 