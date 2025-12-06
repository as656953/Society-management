-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'resident';

-- Update existing admin users to have 'admin' role
UPDATE users SET role = 'admin' WHERE is_admin = true;
