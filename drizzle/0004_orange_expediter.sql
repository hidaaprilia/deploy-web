ALTER TABLE "guests" ADD COLUMN "updatedBy" varchar(255);--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_updatedBy_users_email_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "deleted";