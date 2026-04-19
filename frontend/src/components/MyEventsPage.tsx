import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Navigation from './Navigation';
import EventCard from './EventCard';
import { getMockEvents, Event } from './mockData';
import { useAuth } from './AuthContext';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface MyEventsPageProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function MyEventsPage({ onNavigate }: MyEventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      (async () => {
        const allEvents = await getMockEvents();
        const myEvents = allEvents.filter(event => event.participants.includes(user.id));
        setEvents(myEvents);
      })();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="my-events" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-600">Please sign in to view your events</p>
          <button
            onClick={() => onNavigate('login')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="my-events" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('events')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to all events
        </button>

        <div className="mb-8">
          <h1 className="text-slate-900 mb-2">My Events</h1>
          <p className="text-slate-600">Events you've joined</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 mb-2">No events yet</h3>
            <p className="text-slate-600 mb-6">Start exploring and join events that interest you</p>
            <button
              onClick={() => onNavigate('events')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-slate-600">
                You're participating in {events.length} {events.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onNavigate('event-detail', event.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
