-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    make_model TEXT,
    color TEXT,
    parking_slot TEXT,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    registered_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_apartment_id ON vehicles(apartment_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_number ON vehicles(vehicle_number);
