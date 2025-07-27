export interface Class {
  id: string;
  name: string;
  start_date: string; // DATE 타입은 문자열로 처리
  end_date?: string; // 선택적 필드
  manager_id: string; // managers 테이블의 FK
  client_id: string; // clients 테이블의 FK
  created_at: string;
  updated_at: string;
}
