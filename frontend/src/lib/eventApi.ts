import { http } from './http';

export interface BackendEvent {
  category?: string | null;
  images_json?: string | null;
  id: number;
  title: string;
  description: string;
  organizer_id: number;
  organizer_name?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  views?: number;
  organizer_avatar_url?: string | null;
  organizer_verified?: number | boolean;

}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  datetime: string;
  organizerId: number;
  organizerName: string;
  images: string[];
  category: string;
  participants: number[];
  views: number;
  organizerAvatarUrl?: string | null;
  organizerVerified?: boolean;
  meetingLink?: string | null;
}

type Meta = Pick<Event, 'images' | 'category' | 'participants' | 'views'>;

function loadMeta(): Record<string, Meta> {
  try { return JSON.parse(localStorage.getItem('event_meta') || '{}'); } catch { return {}; }
}
function saveMeta(meta: Record<string, Meta>) {
  localStorage.setItem('event_meta', JSON.stringify(meta));
}

function safeParseImages(value: any): string[] | null {
  if (!value) return null;
  try {
    const arr = JSON.parse(String(value));
    if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string');
  } catch { /* ignore */ }
  return null;
}

function toEvent(be: BackendEvent): Event {
  const meta = loadMeta();
  const m = meta[String(be.id)] || { images: [], category: 'General', participants: [], views: 0 };
  const imagesFromDb = safeParseImages((be as any).images_json);
  const images = imagesFromDb ?? m.images;
  const category = (be as any).category ? String((be as any).category) : m.category;
  const meetingLink = (m as Meta & { meeting_link?: string }).meeting_link ?? null;
  return {
    id: be.id,
    title: be.title,
    description: be.description || '',
    location: be.location || 'TBD',
    datetime: new Date(be.start_time).toISOString(),
    organizerId: be.organizer_id,
    organizerName: be.organizer_name || 'Organizer',
    organizerAvatarUrl: (be as any).organizer_avatar_url ?? null,
    organizerVerified: !!(be as any).organizer_verified,

    images,
    category,
    participants: m.participants,
    views: (be as any).views ?? m.views,
    meetingLink: meetingLink || undefined,
  };
}

export async function getEvents(): Promise<Event[]> {
  const { data } = await http.get<BackendEvent[]>('/api/events');
  return data.map(toEvent);
}

export async function getEvent(id: number): Promise<Event> {
  const { data } = await http.get<BackendEvent>(`/api/events/${id}`);
  return toEvent(data);
}

// Upload 1 event image and return its public URL
export async function uploadEventImages(files: File[]): Promise<string[]> {
  const chosen = Array.from(files || []).slice(0, 1);
  const form = new FormData();
  chosen.forEach((f) => form.append('images', f));

  const { data } = await http.post<{ urls: string[] }>(`/api/events/upload-images`, form);
  return Array.isArray(data?.urls) ? data.urls : [];
}

export async function createEvent(input: {
  title: string;
  description: string;
  location: string;
  datetime: string;
  images: string[];
  category: string;
  meeting_link?: string;
}): Promise<Event> {
  const start = new Date(input.datetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const { data } = await http.post<BackendEvent>('/api/events', {
    title: input.title,
    description: input.description,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    location: input.location,
    category: input.category,
    images: input.images,
  });

  // store meta locally (until you add DB columns / RSVP table)
  const meta = loadMeta() as Record<string, Meta & { meeting_link?: string }>;
  const metaItem: Meta & { meeting_link?: string } = { images: input.images, category: input.category, participants: [], views: 0 };
  if (input.meeting_link?.trim()) metaItem.meeting_link = input.meeting_link.trim();
  meta[String(data.id)] = metaItem;
  saveMeta(meta);

  // also try to store location if DB has column (server install adds it)
  // if server didn't save, client still shows it
  if (input.location) {
    // optional patch if server has location column
    try {
      await http.put(`/api/events/${data.id}`, { location: input.location });
    } catch {
      /* ignore */
    }
  }

  return toEvent({ ...data, location: input.location });
}

export async function deleteEvent(id: number): Promise<void> {
  await http.delete(`/api/events/${id}`);
  const meta = loadMeta();
  delete meta[String(id)];
  saveMeta(meta);
}

export function joinEventLocal(eventId: number, userId: number) {
  const meta = loadMeta();
  const m = meta[String(eventId)] || { images: [], category: 'General', participants: [], views: 0 };
  if (!m.participants.includes(userId)) m.participants.push(userId);
  meta[String(eventId)] = m;
  saveMeta(meta);
}

export interface JoinResult {
  ok: boolean;
  joined?: boolean;
  waitlisted?: boolean;
  ticket_code?: string | null;
  checked_in_at?: string | null;
  promo_code?: string | null;
}

export interface MyTicketResult {
  ok: boolean;
  joined: boolean;
  ticket_code?: string | null;
  checked_in_at?: string | null;
  promo_code?: string | null;
}

export async function joinEvent(eventId: number, userId: number): Promise<JoinResult> {
  // Sodda join: promo/waitlist ishlatmaymiz
  const { data } = await http.post(`/api/events/${eventId}/join`);
  if (data?.joined) {
    joinEventLocal(eventId, userId);
  }
  return data as JoinResult;
}

export async function getMyTicket(eventId: number): Promise<MyTicketResult> {
  const { data } = await http.get(`/api/events/${eventId}/my-ticket`);
  return data as MyTicketResult;
}

export function leaveEventLocal(eventId: number, userId: number) {
  const meta = loadMeta();
  const m = meta[String(eventId)] || { images: [], category: 'General', participants: [], views: 0 };
  m.participants = m.participants.filter((p) => p !== userId);
  meta[String(eventId)] = m;
  saveMeta(meta);
}

export function bumpViewsLocal(eventId: number) {
  const meta = loadMeta();
  const m = meta[String(eventId)] || { images: [], category: 'General', participants: [], views: 0 };
  m.views = (m.views || 0) + 1;
  meta[String(eventId)] = m;
  saveMeta(meta);
}


export async function bumpViews(eventId: number): Promise<number> {
  const { data } = await http.patch<{ views: number }>(`/api/events/${eventId}/view`);
  // keep local meta in sync so old UI code still works
  const meta = loadMeta();
  const m = meta[String(eventId)] || { images: [], category: 'General', participants: [], views: 0 };
  m.views = data.views;
  meta[String(eventId)] = m;
  saveMeta(meta);
  return data.views;
}

export async function updateEvent(
  id: number,
  input: {
    title: string;
    description: string;
    location: string;
    datetime: string;
    images: string[];
    category: string;
    meeting_link?: string;
  }
): Promise<Event> {
  const start = new Date(input.datetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const { data } = await http.put<BackendEvent>(`/api/events/${id}`, {
    title: input.title,
    description: input.description,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    location: input.location,
    category: input.category,
    images: input.images
  });

  // local meta (images/category/participants/views/meeting_link) ni yangilab qo'yamiz
  const meta = loadMeta() as Record<string, Meta & { meeting_link?: string }>;
  const prev = meta[String(id)] || { images: [], category: 'General', participants: [], views: 0 };
  const next: Meta & { meeting_link?: string } = { ...prev, images: input.images, category: input.category };
  if (input.meeting_link !== undefined) next.meeting_link = input.meeting_link?.trim() || undefined;
  meta[String(id)] = next;
  saveMeta(meta);

  return toEvent({ ...data, location: input.location });
}
