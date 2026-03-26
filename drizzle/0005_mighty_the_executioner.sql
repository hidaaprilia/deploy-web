ALTER TABLE "guests" RENAME COLUMN "email" TO "guest_email";--> statement-breakpoint
ALTER TABLE "guests" RENAME COLUMN "organization" TO "guest_organization";--> statement-breakpoint
ALTER TABLE "guests" DROP CONSTRAINT "guests_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_guest_email_users_email_fk" FOREIGN KEY ("guest_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;