-- Migration: Add is_archived column to notices table
-- Purpose: Enable soft-delete/archive functionality for expired notices instead of hard delete
-- Date: December 2024

-- Add is_archived column with default value of false
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for faster queries filtering by archived status
CREATE INDEX IF NOT EXISTS idx_notices_is_archived ON notices(is_archived);

-- Archive any notices that have already expired (one-time cleanup)
UPDATE notices
SET is_archived = TRUE
WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND is_archived = FALSE;
