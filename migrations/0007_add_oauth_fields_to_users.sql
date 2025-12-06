-- Migration: Add OAuth fields to users table
-- Purpose: Enable Google OAuth login and registration
-- Date: December 2024

-- Add email column (unique, nullable for legacy users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add google_id column for storing Google's unique user ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Add profile_picture column for storing Google profile picture URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add auth_provider column to track how user registered ('local' or 'google')
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local' NOT NULL;

-- Make password nullable (Google users won't have a password)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
