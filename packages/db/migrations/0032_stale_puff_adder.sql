CREATE TYPE "public"."login_method" AS ENUM('account', 'qr');--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "login_method" "login_method" DEFAULT 'account' NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "qr_token" text;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "qr_expires_at" timestamp with time zone;