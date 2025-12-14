-- 성능 최적화를 위한 인덱스 추가
-- 400명 동시 사용 대비 최적화

-- 1. class_stock_prices 테이블 인덱스
-- 랭킹, 투자 페이지에서 가장 많이 사용되는 쿼리 패턴
CREATE INDEX IF NOT EXISTS idx_class_stock_prices_class_day ON class_stock_prices(class_id, day);
CREATE INDEX IF NOT EXISTS idx_class_stock_prices_class_stock_day ON class_stock_prices(class_id, stock_id, day);
CREATE INDEX IF NOT EXISTS idx_class_stock_prices_class_day_stock ON class_stock_prices(class_id, day, stock_id);

-- 2. holdings 테이블 인덱스
-- 보유 주식 조회, 랭킹 계산에 필수
CREATE INDEX IF NOT EXISTS idx_holdings_guest_class ON holdings(guest_id, class_id);
CREATE INDEX IF NOT EXISTS idx_holdings_class_guest ON holdings(class_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_holdings_class_stock ON holdings(class_id, stock_id);

-- 3. transactions 테이블 인덱스
-- 거래 내역 조회, 초기 자본 계산에 필수
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_type_subtype ON transactions(wallet_id, type, sub_type);
CREATE INDEX IF NOT EXISTS idx_transactions_class_day ON transactions(class_id, day);

-- 4. guests 테이블 인덱스
-- 클래스별 학생 조회
CREATE INDEX IF NOT EXISTS idx_guests_class ON guests(class_id);

-- 5. wallets 테이블 인덱스
-- 지갑 조회 (이미 unique 제약조건이 있지만 명시적 인덱스 추가)
CREATE INDEX IF NOT EXISTS idx_wallets_guest ON wallets(guest_id);

-- 6. news 테이블 인덱스
-- 뉴스 조회 최적화
CREATE INDEX IF NOT EXISTS idx_news_class_day ON news(class_id, day);

-- 7. classes 테이블 인덱스
-- 관리자별 클래스 조회
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON classes(created_by);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- 8. surveys 테이블 인덱스
-- 설문 조회 최적화
CREATE INDEX IF NOT EXISTS idx_surveys_class ON surveys(class_id);
CREATE INDEX IF NOT EXISTS idx_surveys_guest ON surveys(guest_id);

