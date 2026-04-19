import { Calendar, MapPin, Users, Eye } from 'lucide-react';
import { Event } from './mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { resolvePublicImageUrl } from '../lib/userApi';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const eventDate = new Date(event.datetime);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-slate-200 w-full text-left"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <ImageWithFallback
          src={resolvePublicImageUrl(event.images?.[0] || '')}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          <Eye className="w-4 h-4 text-slate-600" />
          <span className="text-slate-700">{event.views}</span>
        </div>
        <div className="absolute top-3 left-3 bg-indigo-600 px-3 py-1 rounded-full">
          <span className="text-white">{event.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <p className="text-slate-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>
          
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{event.participants.length} {event.participants.length === 1 ? 'participant' : 'participants'}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-slate-500">
            Organized by <span className="text-indigo-600">{event.organizerName}</span>
          </p>
        </div>
      </div>
    </button>
  );
}
