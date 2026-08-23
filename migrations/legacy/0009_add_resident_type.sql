-- Migration: Add resident_type column to users table
-- Purpose: Track whether a user is an owner or tenant of their assigned apartment
-- Date: December 2024

-- Add resident_type column (nullable, only set when apartmentId is assigned)
ALTER TABLE users ADD COLUMN IF NOT EXISTS resident_type TEXT;

-- Add check constraint to ensure valid values
-- Note: PostgreSQL doesn't support IF NOT EXISTS for constraints, so we use a conditional approach
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_resident_type_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_resident_type_check
        CHECK (resident_type IS NULL OR resident_type IN ('OWNER', 'TENANT'));
    END IF;
END $$;
