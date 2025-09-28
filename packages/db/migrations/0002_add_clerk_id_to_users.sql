ALTER TABLE "users" DROP COLUMN IF EXISTS "login_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";
ALTER TABLE "users" ADD COLUMN "clerk_id" text;
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id");
