export interface Manager {
  id: string;
  client_id: string;
  name: string;
  mobile_phone?: string | null;
  email?: string | null;
  created_at: string;
}
