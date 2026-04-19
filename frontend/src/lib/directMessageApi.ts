import { http, wrapApiError } from './http';

export interface DirectMessageInput {
  receiver_id: number;
  message: string;
}

export interface InboxMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  sender_name?: string | null;
  sender_avatar?: string | null;
}

export async function sendDirectMessage(input: DirectMessageInput): Promise<{ ok: boolean; id: number }> {
  try {
    const { data } = await http.post('/api/messages/send', input);
    return data as { ok: boolean; id: number };
  } catch (error) {
    throw wrapApiError(error, 'Failed to send message');
  }
}

export async function getInboxMessages(): Promise<InboxMessage[]> {
  try {
    const { data } = await http.get('/api/messages/inbox');
    return data as InboxMessage[];
  } catch (error) {
    throw wrapApiError(error, 'Failed to load messages');
  }
}
