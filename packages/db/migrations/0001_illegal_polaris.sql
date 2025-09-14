ALTER TABLE "admins" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admins" CASCADE;--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "user_id" TO "id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "managers" DROP CONSTRAINT "managers_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "news" DROP CONSTRAINT "news_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;