-- Step 1: guests 테이블의 login_id unique 제약 제거
ALTER TABLE "guests" DROP CONSTRAINT "guests_login_id_unique";--> statement-breakpoint

-- Step 2: classes 테이블에 code 컬럼 추가 (nullable로 먼저 추가)
ALTER TABLE "classes" ADD COLUMN "code" text;--> statement-breakpoint

-- Step 3: 기존 클래스에 고유 코드 자동 할당
DO $$
DECLARE
    class_record RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR class_record IN SELECT id FROM classes WHERE code IS NULL
    LOOP
        -- 고유한 6자리 코드 생성
        LOOP
            new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || class_record.id::TEXT) FROM 1 FOR 6));
            
            -- 중복 체크
            SELECT EXISTS(SELECT 1 FROM classes WHERE code = new_code) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        -- 코드 할당
        UPDATE classes SET code = new_code WHERE id = class_record.id;
    END LOOP;
END $$;--> statement-breakpoint

-- Step 4: code 컬럼을 NOT NULL로 변경
ALTER TABLE "classes" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint

-- Step 5: code 컬럼에 unique 제약 추가
ALTER TABLE "classes" ADD CONSTRAINT "classes_code_unique" UNIQUE("code");