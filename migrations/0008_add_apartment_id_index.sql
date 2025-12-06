-- Migration: Add index for apartment_id on users table
-- Purpose: Better query performance for user-apartment lookups
-- Date: December 2024

-- Add index for apartment_id lookups (finding users by apartment)
CREATE INDEX IF NOT EXISTS idx_users_apartment_id ON users(apartment_id);
