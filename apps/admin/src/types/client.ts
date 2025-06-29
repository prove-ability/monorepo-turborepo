export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  created_at: string;
}
