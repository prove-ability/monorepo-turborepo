CREATE TYPE "public"."class_status" AS ENUM('setting', 'active', 'ended');--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "status" "class_status" DEFAULT 'setting' NOT NULL;