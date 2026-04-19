import { http, wrapApiError } from './http';

export interface SupportMessageInput {
  name: string;
  email: string;
  message: string;
}

export async function sendSupportMessage(input: SupportMessageInput): Promise<{ ok: boolean; id: number }> {
  try {
    const { data } = await http.post('/api/support', input);
    return data as { ok: boolean; id: number };
  } catch (error) {
    throw wrapApiError(error, 'Failed to send support message');
  }
}
