ALTER TABLE "wallets" RENAME COLUMN "user_id" TO "guest_id";--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_guests_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "balance" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_guest_id_unique" UNIQUE("guest_id");