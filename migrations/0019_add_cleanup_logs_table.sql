-- Create cleanup_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "cleanup_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"reminder_start_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bookings_csv_downloaded" boolean DEFAULT false NOT NULL,
	"visitors_csv_downloaded" boolean DEFAULT false NOT NULL,
	"complaints_csv_downloaded" boolean DEFAULT false NOT NULL,
	"notifications_csv_downloaded" boolean DEFAULT false NOT NULL,
	"notices_csv_downloaded" boolean DEFAULT false NOT NULL,
	"bookings_deleted" integer DEFAULT 0,
	"visitors_deleted" integer DEFAULT 0,
	"complaints_deleted" integer DEFAULT 0,
	"notifications_deleted" integer DEFAULT 0,
	"notices_deleted" integer DEFAULT 0,
	"email_sent_at" timestamp,
	"email_sent_to" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
