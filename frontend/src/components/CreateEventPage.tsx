import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X, Calendar, MapPin, FileText, Image as ImageIcon, AlertCircle, Loader2, Video } from 'lucide-react';
import Navigation from './Navigation';
import { addMockEvent, getEvent, updateEvent } from './mockData';
import { useAuth } from './AuthContext';
import { uploadEventImages } from '../lib/eventApi';
import { resolvePublicImageUrl } from '../lib/userApi';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface CreateEventPageProps {
  onNavigate: (page: Page, eventId?: number) => void;
  eventId?: number | null;
}

const CATEGORIES = ['Technology', 'Music', 'Business', 'Education', 'Sports', 'Arts & Culture', 'Food & Drink', 'Health & Wellness'];

// Demo rasmlar olib tashlandi. Event uchun rasm to'g'ridan-to'g'ri kompyuterdan yuklanadi.

export default function CreateEventPage({ onNavigate, eventId }: CreateEventPageProps) {
  const { user } = useAuth();
  const isEdit = !!eventId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState<string[]>([]);       // ko'rsatish uchun (data URL yoki server URL)
  const [serverImageUrls, setServerImageUrls] = useState<string[]>([]); // submit uchun (faqat server)
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const [imgUploading, setImgUploading] = useState(false);

  // ✅ Edit mode bo'lsa: eventni olib kelib formni to'ldiramiz
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      try {
        const ev = await getEvent(Number(eventId));
        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setLocation(ev.location || '');
        setCategory(CATEGORIES.includes(ev.category) ? ev.category : CATEGORIES[0]);
        const imgs = Array.isArray(ev.images) ? ev.images : [];
        setImages(imgs);
        setServerImageUrls(imgs);

        const d = new Date(ev.datetime);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
        setTime(`${hh}:${mi}`);
        setMeetingLink((ev as { meetingLink?: string }).meetingLink || '');
      } catch {
        // event topilmasa: create rejimida qoladi
      }
    })();
  }, [eventId]);

  const isOrganizer = Boolean((user as any)?.is_organizer);
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  if (!user || (!isOrganizer && !isAdmin)) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="create-event" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">Only organizers and admins can create events</p>
          <button onClick={() => onNavigate('events')} className="text-indigo-600 hover:text-indigo-700">
            Back to events
          </button>
        </div>
      </div>
    );
  }

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');

    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;

    const remain = Math.max(0, 1 - serverImageUrls.length);
    const chosen = list.slice(0, remain);
    if (list.length > remain) {
      setError('Maksimum 1 ta rasm qo\'shish mumkin');
    }

    if (!chosen.length) return;

    setImgUploading(true);
    try {
      // Darhol preview uchun data URL (hech qachon broken bo'lmaydi)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error('Rasm o\'qishda xatolik'));
        fr.readAsDataURL(chosen[0]);
      });
      setImages([dataUrl]);

      const urls = await uploadEventImages(chosen);
      setServerImageUrls(urls.slice(0, 1));
    } catch (err) {
      setImages([]);
      setServerImageUrls([]);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.message || (err as any).response?.data?.error
        : null;
      setError(msg || 'Event rasm yuklashda xatolik. Backend ishlayotganini tekshiring.');
    } finally {
      setImgUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setServerImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !location || !date || !time) {
      setError('Please fill in all required fields');
      return;
    }

    if (imgUploading) {
      setError('Rasmlar hali yuklanmoqda, kuting');
      return;
    }

    if (serverImageUrls.length === 0) {
      setError('Please add at least one image');
      return;
    }

    const datetime = `${date}T${time}:00`;

    // ✅ EDIT => SAVE
    if (isEdit && eventId) {
      await updateEvent(Number(eventId), { title, description, location, datetime, images: serverImageUrls, category, meeting_link: meetingLink });
      onNavigate('event-detail', Number(eventId));
      return;
    }

    // ✅ CREATE
    const created = await addMockEvent({ title, description, location, datetime, images: serverImageUrls, category, meeting_link: meetingLink });
    onNavigate('event-detail', created.id);
  };

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="create-event" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => {
            if (isEdit && eventId) return onNavigate('event-detail', Number(eventId));
            onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'organizer-dashboard');
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {isEdit ? 'Back to event' : 'Back to dashboard'}
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h1 className="text-slate-900 mb-2">{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
          <p className="text-slate-600 mb-8">{isEdit ? 'Update your event details' : 'Fill in the details to create your event'}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="flex items-center gap-2 text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Event Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Tech Innovation Summit 2025"
              />
            </div>

            <div>
              <label htmlFor="description" className="flex items-center gap-2 text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Describe your event in detail..."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-slate-700 mb-2">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all bg-white"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="flex items-center gap-2 text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Location *
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="e.g., San Francisco Convention Center"
              />
            </div>

            <div>
              <label htmlFor="meetingLink" className="flex items-center gap-2 text-slate-700 mb-2">
                <Video className="w-4 h-4 text-indigo-600" />
                Zoom / Meeting link (ixtiyoriy)
              </label>
              <input
                id="meetingLink"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="e.g., https://zoom.us/j/123456789"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="flex items-center gap-2 text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="time" className="flex items-center gap-2 text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Time *
                </label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-slate-700 mb-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Event Image * (1 ta rasm majburiy)
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={resolvePublicImageUrl(img)} alt={`Event image ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition-all flex items-center justify-center gap-2 ${
                  serverImageUrls.length >= 1
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer'
                }`}
                title="Kompyuterdan rasm tanla (1 ta)"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={imgUploading || serverImageUrls.length >= 1}
                  onChange={(e) => {
                    handleImageFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {imgUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                <span>{imgUploading ? 'Yuklanyapti...' : `Rasm tanlash ( ${serverImageUrls.length}/1 )`}</span>
              </label>
              <p className="mt-2 text-sm text-slate-500">Faqat 1 ta rasm yuklash mumkin.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (isEdit && eventId) return onNavigate('event-detail', Number(eventId));
                  onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'organizer-dashboard');
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {isEdit ? 'Save Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
