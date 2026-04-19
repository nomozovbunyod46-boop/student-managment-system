import { useEffect, useState } from 'react';
import { ArrowLeft, User, Shield, CheckCircle2 } from 'lucide-react';
import Navigation from './Navigation';
import { getPublicUser, resolvePublicImageUrl, PublicUserProfile } from '../lib/userApi';

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

interface PublicProfilePageProps {
  onNavigate: (page: Page, id?: number) => void;
  userId: number | null;
  backEventId?: number | null;
}

export default function PublicProfilePage({ onNavigate, userId, backEventId }: PublicProfilePageProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await getPublicUser(userId);
        setProfile(u);
      } catch (e: any) {
        setProfile(null);
        setError(e?.response?.data?.message || 'Profil topilmadi');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const goBack = () => {
    if (backEventId) {
      onNavigate('event-detail', backEventId);
      return;
    }
    onNavigate('events');
  };

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="public-profile" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center text-slate-600">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => onNavigate('events')}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Back to events
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-center">
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={resolvePublicImageUrl(profile.avatar_url)}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-indigo-600" />
                )}
              </div>
              <h1 className="text-white mb-2">{profile.name}</h1>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/90 text-slate-800">
                <Shield className="w-4 h-4" />
                <span className="capitalize">
                  {Boolean(profile.is_organizer) ? 'organizer' : profile.role}
                </span>
                {Boolean(profile.is_organizer) && Boolean(profile.organizer_verified) && (
                  <CheckCircle2 className="w-4 h-4 text-sky-500" title="Verified organizer" />
                )}
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-slate-900 mb-2">Public profile</h2>
              <p className="text-slate-600">Bu yerda faqat public ma’lumotlar ko‘rsatiladi (ism + avatar).</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
