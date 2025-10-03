-- admin_role enum이 이미 존재하면 스킵
DO $$ BEGIN
 CREATE TYPE "public"."admin_role" AS ENUM('superadmin', 'admin', 'manager');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- admins 테이블이 이미 존재하면 스킵
DO $$ BEGIN
 CREATE TABLE IF NOT EXISTS "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
 );
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint

-- users 테이블 컬럼 변경
-- 1. phone -> mobile_phone
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE "users" RENAME COLUMN "phone" TO "mobile_phone";
  END IF;
END $$;--> statement-breakpoint

-- 2. school_name -> affiliation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='school_name') THEN
    ALTER TABLE "users" RENAME COLUMN "school_name" TO "affiliation";
  END IF;
END $$;--> statement-breakpoint

-- 3. auth_id unique 제약 삭제 (있으면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_auth_id_unique') THEN
    ALTER TABLE "users" DROP CONSTRAINT "users_auth_id_unique";
  END IF;
END $$;--> statement-breakpoint

-- 4. auth_id 컬럼 삭제 (있으면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='auth_id') THEN
    ALTER TABLE "users" DROP COLUMN "auth_id";
  END IF;
END $$;--> statement-breakpoint

-- 5. NOT NULL 제약 추가
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "mobile_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "affiliation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "class_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "grade" SET NOT NULL;
