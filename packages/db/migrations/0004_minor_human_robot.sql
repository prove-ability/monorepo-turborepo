ALTER TABLE "classes" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "created_by" SET NOT NULL;