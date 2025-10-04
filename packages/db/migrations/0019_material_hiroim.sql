ALTER TABLE "guests" ADD COLUMN "login_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_login_id_unique" UNIQUE("login_id");