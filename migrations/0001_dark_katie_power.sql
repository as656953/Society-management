CREATE INDEX IF NOT EXISTS "idx_complaint_comments_complaint_id" ON "complaint_comments" USING btree ("complaint_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_apartment_id" ON "complaints" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_created_at" ON "complaints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_created_by" ON "complaints" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_status" ON "complaints" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notices_is_archived" ON "notices" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_preferences_user_id" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pre_approved_apartment_id" ON "pre_approved_visitors" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pre_approved_expected_date" ON "pre_approved_visitors" USING btree ("expected_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pre_approved_status" ON "pre_approved_visitors" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_auth_provider" ON "users" USING btree ("auth_provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vehicles_apartment_id" ON "vehicles" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vehicles_vehicle_number" ON "vehicles" USING btree ("vehicle_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_visitors_apartment_id" ON "visitors" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_visitors_entry_time" ON "visitors" USING btree ("entry_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_visitors_status" ON "visitors" USING btree ("status");