-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    -- In-app notification preferences
    booking_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    complaint_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    visitor_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    notice_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    system_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    -- Email notification preferences (for future email integration)
    email_booking_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    email_complaint_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    email_visitor_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    email_notice_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    email_emergency_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
