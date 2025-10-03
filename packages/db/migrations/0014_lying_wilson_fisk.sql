ALTER TABLE "users" RENAME TO "guests";--> statement-breakpoint
ALTER TABLE "holdings" DROP CONSTRAINT "holdings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "guests" DROP CONSTRAINT "users_class_id_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_guests_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_guests_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;