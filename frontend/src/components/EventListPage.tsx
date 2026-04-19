import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import Navigation from './Navigation';
import EventCard from './EventCard';
import { getMockEvents, Event } from './mockData';

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

interface EventListPageProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

export default function EventListPage({ onNavigate }: EventListPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'upcoming'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await getMockEvents();
    setEvents(data);
  };

  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];

  const filteredAndSortedEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id - a.id;
      } else if (sortBy === 'popular') {
        return b.views - a.views;
      } else {
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      }
    });

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="events" />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="mb-4">Discover Amazing Events</h1>
          <p className="text-xl mb-8 text-white/90">Find and join events that match your interests</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by title, location, or keyword..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-5 h-5 text-slate-600" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'upcoming')}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-white"
            >
              <option value="upcoming">Upcoming</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-slate-600">
                Showing {filteredAndSortedEvents.length}{' '}
                {filteredAndSortedEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAndSortedEvents.map((event) => (
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
