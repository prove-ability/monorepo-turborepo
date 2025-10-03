-- 1. 컬럼 이름 변경 (phone -> mobile_phone)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE "users" RENAME COLUMN "phone" TO "mobile_phone";
  END IF;
END $$;

-- 2. 컬럼 이름 변경 (school_name -> affiliation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='school_name') THEN
    ALTER TABLE "users" RENAME COLUMN "school_name" TO "affiliation";
  END IF;
END $$;

-- 3. 필수 컬럼에 NOT NULL 제약 추가
-- name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='name' AND is_nullable='YES') THEN
    ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
  END IF;
END $$;

-- mobile_phone
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='mobile_phone' AND is_nullable='YES') THEN
    ALTER TABLE "users" ALTER COLUMN "mobile_phone" SET NOT NULL;
  END IF;
END $$;

-- affiliation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='affiliation' AND is_nullable='YES') THEN
    ALTER TABLE "users" ALTER COLUMN "affiliation" SET NOT NULL;
  END IF;
END $$;

-- grade (타입도 text로 변경)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='grade') THEN
    -- 타입 변경 (필요시)
    ALTER TABLE "users" ALTER COLUMN "grade" TYPE text USING "grade"::text;
    -- NOT NULL 제약 추가
    ALTER TABLE "users" ALTER COLUMN "grade" SET NOT NULL;
  END IF;
END $$;

-- class_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='class_id' AND is_nullable='YES') THEN
    ALTER TABLE "users" ALTER COLUMN "class_id" SET NOT NULL;
  END IF;
END $$;
