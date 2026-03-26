CREATE TABLE "whistleblowing" (
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
ALTER TABLE "pengaduan" ADD COLUMN "id" integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "pengaduan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "pengaduan" ADD COLUMN "proof" text NOT NULL;--> statement-breakpoint
ALTER TABLE "whistleblowing" ADD CONSTRAINT "whistleblowing_reporter_users_email_fk" FOREIGN KEY ("reporter") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;