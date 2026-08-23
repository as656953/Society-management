-- Create pre_approved_visitors table
CREATE TABLE IF NOT EXISTS pre_approved_visitors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  purpose TEXT NOT NULL,
  apartment_id INTEGER NOT NULL,
  expected_date TIMESTAMP NOT NULL,
  expected_time_from TEXT,
  expected_time_to TEXT,
  number_of_persons INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pre_approved_apartment_id ON pre_approved_visitors(apartment_id);
CREATE INDEX IF NOT EXISTS idx_pre_approved_status ON pre_approved_visitors(status);
CREATE INDEX IF NOT EXISTS idx_pre_approved_expected_date ON pre_approved_visitors(expected_date);
