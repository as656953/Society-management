-- Add pre_approved_visitor_id to visitors table to link with pre-approvals
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS pre_approved_visitor_id INTEGER REFERENCES pre_approved_visitors(id);

-- Add 'completed' status to pre_approved_visitors for when visitor checks out
-- (status can now be: 'pending', 'arrived', 'expired', 'cancelled', 'completed')
