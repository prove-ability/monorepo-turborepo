ALTER TABLE "classes" ALTER COLUMN "current_day" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "current_day" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "total_days" integer NOT NULL;