ALTER TABLE "admins" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admins" CASCADE;--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "phone" TO "mobile_phone";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "school_name" TO "affiliation";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_auth_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "class_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "grade" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "auth_id";--> statement-breakpoint
DROP TYPE "public"."admin_role";