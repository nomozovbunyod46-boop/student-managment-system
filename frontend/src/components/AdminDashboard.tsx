import { useState, useEffect } from 'react';
import { Users, Calendar, Eye, Trash2, Shield, TrendingUp } from 'lucide-react';
import Navigation from './Navigation';
import { getMockEvents, deleteMockEvent, Event } from './mockData';
import { useAuth } from './AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { resolvePublicImageUrl } from '../lib/userApi';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface AdminDashboardProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users'>('overview');
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await getMockEvents();
    setEvents(data);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await deleteMockEvent(eventId);
      loadEvents();
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="admin-dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">Administrator access required</p>
          <button
            onClick={() => onNavigate('events')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to events
          </button>
        </div>
      </div>
    );
  }

  const totalParticipants = events.reduce((sum, event) => sum + event.participants.length, 0);
  const totalViews = events.reduce((sum, event) => sum + event.views, 0);
  const uniqueOrganizers = new Set(events.map(e => e.organizerId)).size;

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="admin-dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600">Manage platform content and monitor activity</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-4 px-2 transition-all ${
                activeTab === 'events'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Events Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-2 transition-all ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-indigo-100">Total Events</p>
                  <Calendar className="w-5 h-5 text-indigo-200" />
                </div>
                <p className="mb-1">{events.length}</p>
                <p className="text-indigo-200">Active on platform</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-purple-100">Total Participants</p>
                  <Users className="w-5 h-5 text-purple-200" />
                </div>
                <p className="mb-1">{totalParticipants}</p>
                <p className="text-purple-200">Event registrations</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-pink-100">Total Views</p>
                  <Eye className="w-5 h-5 text-pink-200" />
                </div>
                <p className="mb-1">{totalViews}</p>
                <p className="text-pink-200">Platform engagement</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-amber-100">Organizers</p>
                  <TrendingUp className="w-5 h-5 text-amber-200" />
                </div>
                <p className="mb-1">{uniqueOrganizers}</p>
                <p className="text-amber-200">Active organizers</p>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-slate-900 mb-4">Recent Events</h3>
              <div className="space-y-3">
                {events.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={resolvePublicImageUrl(event.images?.[0] || '')}
                        alt={event.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-slate-900">{event.title}</p>
                        <p className="text-slate-500">{event.category} • {event.participants.length} participants</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('event-detail', event.id)}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Management Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-slate-900">All Events</h3>
              <p className="text-slate-600">Manage and moderate platform events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-700">Event</th>
                    <th className="px-6 py-4 text-left text-slate-700">Organizer</th>
                    <th className="px-6 py-4 text-left text-slate-700">Date</th>
                    <th className="px-6 py-4 text-left text-slate-700">Stats</th>
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
                        <p className="text-slate-700">{event.organizerName}</p>
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
                        <div className="flex items-center gap-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participants.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{event.views}</span>
                          </div>
                        </div>
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h3 className="text-slate-900 mb-4">User Management</h3>
            <p className="text-slate-600 mb-6">User management features coming soon. This will include role assignment, user verification, and account management.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-indigo-600 mb-1">Total Users</p>
                <p className="text-indigo-900">3</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-purple-600 mb-1">Organizers</p>
                <p className="text-purple-900">{uniqueOrganizers}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-pink-600 mb-1">Participants</p>
                <p className="text-pink-900">1</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
