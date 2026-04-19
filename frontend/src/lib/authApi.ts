import { http } from './http';

export type UserRole = 'participant' | 'verified_user' | 'organizer' | 'moderator' | 'admin' | 'super_admin' | 'security_officer' | 'auditor';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_organizer?: number | boolean;
  avatar_url?: string | null;
  organizer_verified?: number | boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'participant'
): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/register', { name, email, password, role });
  return data;
}
