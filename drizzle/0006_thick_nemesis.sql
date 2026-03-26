CREATE TABLE "pengaduan" (
	"reporter" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"category" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"suspect" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_reporter_users_email_fk" FOREIGN KEY ("reporter") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;