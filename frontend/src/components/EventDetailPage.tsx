import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Eye, UserCheck, UserPlus, AlertCircle, Pencil, Video } from 'lucide-react';
import QRCode from 'react-qr-code';
import Navigation from './Navigation';
import { resolvePublicImageUrl } from '../lib/userApi';
import { getMockEvents, joinEvent, leaveEvent, updateMockEvent, getMyTicket, Event } from './mockData';
import { useAuth } from './AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

type Page =
  | 'login'
  | 'register'
  | 'events'
  | 'event-detail'
  | 'create-event'
  | 'organizer-dashboard'
  | 'admin-dashboard'
  | 'my-events'
  | 'profile'
  | 'public-profile';

interface EventDetailPageProps {
  eventId: number | null;
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function EventDetailPage({ eventId, onNavigate }: EventDetailPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [myTicket, setMyTicket] = useState<{ ticket_code: string; checked_in_at?: string | null; promo_code?: string | null } | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!eventId) return;

    (async () => {
      const events = await getMockEvents();
      const foundEvent = events.find((e) => e.id === eventId);
      setEvent(foundEvent || null);

      // views +1
      if (foundEvent) {
        await updateMockEvent(foundEvent.id);
        const refreshed = (await getMockEvents()).find((e) => e.id === foundEvent.id);
        if (refreshed) setEvent(refreshed);
      }

      // my ticket (QR)
      if (user) {
        try {
          const t = await getMyTicket(Number(eventId));
          if (t?.joined && t.ticket_code) {
            setMyTicket({
              ticket_code: t.ticket_code,
              checked_in_at: t.checked_in_at ?? null,
              promo_code: (t as any).promo_code ?? null
            });
          } else {
            setMyTicket(null);
          }
        } catch {
          // ignore
        }
      } else {
        setMyTicket(null);
      }
    })();
  }, [eventId, user]);

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="event-detail" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-600">Event not found</p>
          <button onClick={() => onNavigate('events')} className="mt-4 text-indigo-600 hover:text-indigo-700">
            Back to events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.datetime);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const isUserParticipant = user ? event.participants.includes(user.id) : false;

  // ✅ organizer id qaysi fieldda bo‘lsa ham topib, isOwner ni 100% qilish
  const organizerId =
    (event as any).organizer_id ??
    (event as any).organizerId ??
    (event as any).organizer?.id;

  const isOwner = !!user && organizerId != null && String(organizerId) === String(user.id);

  const handleJoinToggle = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (user.role === 'guest') {
      alert('Please register as a participant to join events');
      return;
    }

    if (isOwner) {
      alert("You can't join your own event");
      return;
    }

    if (isUserParticipant) {
      leaveEvent(event.id, user.id);
      setMyTicket(null);
    } else {
      const result = await joinEvent(event.id, user.id);
      if (result?.joined && result.ticket_code) {
        setMyTicket({
          ticket_code: result.ticket_code,
          checked_in_at: result.checked_in_at ?? null,
          promo_code: (result as any).promo_code ?? null
        });
      }
    }

    // Refresh event data
    const events = await getMockEvents();
    const updatedEvent = events.find((e) => e.id === event.id);
    if (updatedEvent) setEvent(updatedEvent);
  };

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="event-detail" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('events')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              <div className="relative h-96 bg-slate-100">
                <ImageWithFallback
                  src={resolvePublicImageUrl(event.images[currentImageIndex] || '')}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />

                {event.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {event.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              {/* ✅ Title + Edit button */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full mb-3">{event.category}</span>
                  <h1 className="text-slate-900 mb-2">{event.title}</h1>
                </div>

                {(isOwner || user?.role === 'admin') && (
                  <button
                    onClick={() => onNavigate('create-event', event.id)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Event
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-slate-500">Date & Time</p>
                    <p>{formattedDate}</p>
                    <p>{formattedTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-slate-500">Participants</p>
                    <p>{event.participants.length} joined</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-slate-500">Views</p>
                    <p>{event.views} views</p>
                  </div>
                </div>
              </div>

              {event.meetingLink && (
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                >
                  <Video className="w-5 h-5 shrink-0" />
                  Join Zoom / Meeting
                </a>
              )}

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-slate-900 mb-3">About This Event</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            </div>

            {/* Organizer/Admin qo‘shimcha kod bilan ishlaydigan toollari olib tashlandi */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {!isOwner ? (
              // Participant/Guest uchun
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 sticky top-24">
                <h3 className="text-slate-900 mb-4">Join This Event</h3>

                {!user && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800">Please sign in to join this event</p>
                  </div>
                )}

                <button
                  onClick={handleJoinToggle}
                  className={`w-full py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    isUserParticipant
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isUserParticipant ? (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Already Joined
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Join Event
                    </>
                  )}
                </button>

                {/* My Ticket (QR) */}
                {myTicket?.ticket_code && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-900 mb-2">Ticket code:</p>
                    <p className="font-mono text-sm break-all text-slate-700">{myTicket.ticket_code}</p>

                    <div className="mt-4 flex items-center justify-center bg-white rounded-lg p-4 border border-slate-200">
                      <QRCode value={myTicket.ticket_code} size={160} />
                    </div>

                    <p className="mt-3 text-slate-700">Check-in: {myTicket.checked_in_at ? '✅ Done' : '⏳ Not yet'}</p>

                    {myTicket.promo_code && <p className="mt-1 text-slate-500 text-sm">Promo: {myTicket.promo_code}</p>}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-slate-900 mb-3">Organizer</h4>
                  <button
                    onClick={() => onNavigate('public-profile', (event as any).organizerId ?? (event as any).organizer_id ?? organizerId)}
                    className="w-full flex items-center gap-3 p-3 -m-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    title="Organizer profilini ko‘rish"
                  >
                    {(event as any).organizerAvatarUrl ? (
  <img
    src={resolvePublicImageUrl((event as any).organizerAvatarUrl)}
    className="w-12 h-12 rounded-full object-cover border border-slate-200"
    alt={event.organizerName}
  />
) : (
  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
    <span className="text-white">{event.organizerName.charAt(0)}</span>
  </div>
)}

                    <div>
                      <p className="text-slate-900">{event.organizerName}</p>
                      <p className="text-slate-500">Event Organizer • Profilni ko‘rish</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // ✅ Organizer o‘z eventiga kirsa JOIN ko‘rinmaydi
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 sticky top-24">
                <h3 className="text-slate-900 mb-2">This is your event</h3>
                <p className="text-slate-600 text-sm">
                  Organizers can’t join their own events. Please use the dashboard to manage it.
                </p>

                <button
                  onClick={() => onNavigate('organizer-dashboard')}
                  className="mt-4 w-full py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  Organizer Dashboard
                </button>

                {/* ✅ Edit button (sidebar) */}
                <button
                  onClick={() => onNavigate('create-event', event.id)}
                  className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Event
                </button>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-slate-900 mb-3">Organizer</h4>
                  <button
                    onClick={() => onNavigate('public-profile', (event as any).organizerId ?? (event as any).organizer_id ?? organizerId)}
                    className="w-full flex items-center gap-3 p-3 -m-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    title="Organizer profilini ko‘rish"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white">{event.organizerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-slate-900">{event.organizerName}</p>
                      <p className="text-slate-500">Event Organizer • Profilni ko‘rish</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
