import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Eye, Calendar } from 'lucide-react';
import Navigation from './Navigation';
import { getMockEvents, deleteMockEvent, Event } from './mockData';
import { useAuth } from './AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { resolvePublicImageUrl } from '../lib/userApi';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface OrganizerDashboardProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function OrganizerDashboard({ onNavigate }: OrganizerDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (user) {
      const allEvents = await getMockEvents();
      const myEvents = allEvents.filter(event => event.organizerId === user.id);
      setEvents(myEvents);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteMockEvent(eventId);
      loadEvents();
      setSelectedEvent(null);
    }
  };

  const isOrganizer = Boolean((user as any)?.is_organizer);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  if (!user || (!isOrganizer && !isAdmin)) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="organizer-dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-600">Access denied. Organizer access required.</p>
          <button
            onClick={() => onNavigate('events')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Back to events
          </button>
        </div>
      </div>
    );
  }

  const totalParticipants = events.reduce((sum, event) => sum + event.participants.length, 0);
  const totalViews = events.reduce((sum, event) => sum + event.views, 0);

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="organizer-dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-slate-900 mb-2">Organizer Dashboard</h1>
          <p className="text-slate-600">Manage your events and track engagement</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600">Total Events</p>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-slate-900">{events.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600">Total Participants</p>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-slate-900">{totalParticipants}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600">Total Views</p>
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-slate-900">{totalViews}</p>
          </div>
        </div>

        {/* Create Event Button */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('create-event')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No events yet</h3>
            <p className="text-slate-600 mb-6">Create your first event to get started</p>
            <button
              onClick={() => onNavigate('create-event')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-700">Event</th>
                    <th className="px-6 py-4 text-left text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left text-slate-700">Participants</th>
                    <th className="px-6 py-4 text-left text-slate-700">Views</th>
                    <th className="px-6 py-4 text-right text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={resolvePublicImageUrl(event.images?.[0] || '')}
                            alt={event.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-slate-900">{event.title}</p>
                            <p className="text-slate-500">{event.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">
                          {new Date(event.datetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Users className="w-4 h-4" />
                          {event.participants.length}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">{event.views}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigate('event-detail', event.id)}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-slate-900">Participants</h3>
                <p className="text-slate-600">{selectedEvent.title}</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                {selectedEvent.participants.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No participants yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvent.participants.map((participantId, index) => (
                      <div key={participantId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white">P{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-slate-900">Participant #{participantId}</p>
                          <p className="text-slate-500">Joined</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
