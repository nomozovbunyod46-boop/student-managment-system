import { ArrowRight, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import Navigation from './Navigation';

type Page =
  | 'home'
  | 'login'
  | 'register'
  | 'events'
  | 'event-detail'
  | 'create-event'
  | 'organizer-dashboard'
  | 'admin-dashboard'
  | 'my-events'
  | 'profile';

interface HomePageProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="home" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
              <ShieldCheck className="w-4 h-4" />
              Trusted event platform
            </span>
            <h1 className="text-slate-900 mt-4 mb-4">
              Discover and Join Amazing Events
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              Explore curated experiences, join with secure tickets, and manage your own
              gatherings in one modern platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('events')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                Explore Events
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <CalendarDays className="w-6 h-6 text-indigo-600 mb-3" />
                <h3 className="text-slate-900 mb-1">Upcoming events</h3>
                <p className="text-slate-600 text-sm">Plan ahead with accurate schedules.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <Users className="w-6 h-6 text-indigo-600 mb-3" />
                <h3 className="text-slate-900 mb-1">Verified organizers</h3>
                <p className="text-slate-600 text-sm">Join events with trusted hosts.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 sm:col-span-2">
                <h3 className="text-slate-900 mb-2">Create and manage</h3>
                <p className="text-slate-600 text-sm">
                  Organizers can publish events, issue tickets, and track attendance in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
