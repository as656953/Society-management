-- Create visitors table for entry/exit logs
CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  purpose TEXT NOT NULL,
  apartment_id INTEGER NOT NULL,
  vehicle_number TEXT,
  photo_url TEXT,
  entry_time TIMESTAMP NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'inside',
  created_by INTEGER NOT NULL,
  notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitors_apartment_id ON visitors(apartment_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_entry_time ON visitors(entry_time);
