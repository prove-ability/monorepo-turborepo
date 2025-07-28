export interface User {
  user_id: string;
  login_id: string;
  nickname: string;
  name: string;
  phone: string;
  grade: number;
  school_name: string;
  class_id: string;
  created_at: string;
  updated_at: string;
  // 관계형 데이터 (optional)
  clients?: {
    id: string;
    name: string;
  };
  classes?: {
    id: string;
    name: string;
  };
}

export interface CreateUserData {
  nickname: null;
  name: string;
  phone: string;
  grade: number;
  school_name: string;
  client_id: string;
  class_id: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {}
