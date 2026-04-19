import { http } from './http';

export interface OrganizerPublic {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  organizer_verified?: number | boolean;
}

export interface PublicUserProfile {
  id: number;
  name: string;
  role: string;
  is_organizer: number | boolean;
  organizer_verified?: number | boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await http.post<{ avatar_url: string }>('/api/users/me/avatar', form, {
    
  });
  return data;
}

export async function listOrganizers(): Promise<OrganizerPublic[]> {
  const { data } = await http.get<OrganizerPublic[]>('/api/users/organizers');
  return data;
}

export async function getPublicUser(userId: number): Promise<PublicUserProfile> {
  const { data } = await http.get<PublicUserProfile>(`/api/users/public/${userId}`);
  return data;
}

export function resolvePublicImageUrl(path: string): string {
  if (!path) return '';
  const p = String(path).trim();
  if (!p) return '';

  // Already absolute (blob, data, http) - o'zgartirmasdan
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p) || /^data:/i.test(p) || /^blob:/i.test(p)) return p;

  const withSlash = p.startsWith('/') ? p : `/${p}`;

  // Dev: Vite proxy orqali /api va /uploads backend ga boradi. Rasmlar hamma sahifada ko'rinsin.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}${withSlash}`;
  }

  // Prod: API base URL dan
  let base = String((http.defaults as any).baseURL || (import.meta as any).env?.VITE_API_URL || '').trim();
  base = base.replace(/\/+$/, '').replace(/\/api$/, '');
  return base ? `${base}${withSlash}` : withSlash;
}
export async function getMe() {
  const { data } = await http.get('/api/users/me');
  return data;
}

