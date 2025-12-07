CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"max_capacity" integer,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apartments" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"tower_id" integer NOT NULL,
	"floor" integer NOT NULL,
	"type" text NOT NULL,
	"owner_name" text,
	"status" text DEFAULT 'OCCUPIED' NOT NULL,
	"monthly_rent" numeric,
	"sale_price" numeric,
	"contact_number" text
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cleanup_logs" (
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
--> statement-breakpoint
CREATE TABLE "complaint_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"complaint_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"apartment_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolution_notes" text
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"expires_at" timestamp,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"booking_notifications" boolean DEFAULT true NOT NULL,
	"complaint_notifications" boolean DEFAULT true NOT NULL,
	"visitor_notifications" boolean DEFAULT true NOT NULL,
	"notice_notifications" boolean DEFAULT true NOT NULL,
	"system_notifications" boolean DEFAULT true NOT NULL,
	"email_booking_notifications" boolean DEFAULT false NOT NULL,
	"email_complaint_notifications" boolean DEFAULT false NOT NULL,
	"email_visitor_notifications" boolean DEFAULT false NOT NULL,
	"email_notice_notifications" boolean DEFAULT true NOT NULL,
	"email_emergency_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_approved_visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mobile_number" text,
	"purpose" text NOT NULL,
	"apartment_id" integer NOT NULL,
	"expected_date" timestamp NOT NULL,
	"expected_time_from" text,
	"expected_time_to" text,
	"number_of_persons" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "towers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'resident' NOT NULL,
	"name" text NOT NULL,
	"apartment_id" integer,
	"resident_type" text,
	"phone" text,
	"email" text,
	"google_id" text,
	"profile_picture" text,
	"auth_provider" text DEFAULT 'local' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer NOT NULL,
	"vehicle_type" text NOT NULL,
	"vehicle_number" text NOT NULL,
	"make_model" text,
	"color" text,
	"parking_slot" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"registered_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mobile_number" text NOT NULL,
	"purpose" text NOT NULL,
	"apartment_id" integer NOT NULL,
	"vehicle_number" text,
	"photo_url" text,
	"entry_time" timestamp DEFAULT now() NOT NULL,
	"exit_time" timestamp,
	"status" text DEFAULT 'inside' NOT NULL,
	"created_by" integer NOT NULL,
	"notes" text,
	"pre_approved_visitor_id" integer
);
--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;