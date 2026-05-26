export type UserRole = 'manager' | 'rep' | 'org_admin' | 'admin' | 'trainer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  org_id?: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  user: User;
}
