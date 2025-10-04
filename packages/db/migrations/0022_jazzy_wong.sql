ALTER TABLE "holdings" RENAME COLUMN "user_id" TO "guest_id";--> statement-breakpoint
ALTER TABLE "holdings" DROP CONSTRAINT "holdings_user_id_guests_id_fk";
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;