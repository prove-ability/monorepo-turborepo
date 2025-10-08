ALTER TABLE "surveys" DROP CONSTRAINT "surveys_guest_id_guests_id_fk";
--> statement-breakpoint
ALTER TABLE "surveys" ALTER COLUMN "guest_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;