import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, User, Mail, Shield, Save, AlertCircle, Camera, CheckCircle2 } from 'lucide-react';
import Navigation from './Navigation';
import { useAuth } from './AuthContext';
import { uploadAvatar, resolvePublicImageUrl } from '../lib/userApi';
import AvatarCropModal from './AvatarCropModal';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, updateProfile, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation onNavigate={onNavigate} currentPage="profile" />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-600">Please sign in to view your profile</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    const url = URL.createObjectURL(file);
    cropUrlRef.current = url;
    setCropSrc(url);
    setCropOpen(true);

    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
      const res = await uploadAvatar(file);
      updateProfile({ avatar_url: res.avatar_url });
      // Backend'dan qayta olib, hamma joyda darhol ko'rinsin
      await refreshUser();
      setCropOpen(false);
    } catch {
      setAvatarError('Avatar yuklashda xatolik');
    } finally {
      setAvatarUploading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'security_officer':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'auditor':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'moderator':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'organizer':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'verified_user':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'participant':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const displayRole = Boolean((user as any).is_organizer) ? 'organizer' : user.role;

  return (
    <div className="min-h-screen">
      <AvatarCropModal
        open={cropOpen}
        src={cropSrc}
        uploading={avatarUploading}
        onCancel={() => setCropOpen(false)}
        onConfirm={handleCropConfirm}
      />
      <Navigation onNavigate={onNavigate} currentPage="profile" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('events')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to events
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden relative">
              {user.avatar_url ? (
                <img src={resolvePublicImageUrl(user.avatar_url)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-indigo-600" />
              )}
              <label className="absolute bottom-1 right-1 bg-white/90 hover:bg-white rounded-full p-2 cursor-pointer shadow" title="Avatar yuklash">
                <Camera className="w-4 h-4 text-indigo-600" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
            </div>
            {avatarError && <p className="text-amber-100">{avatarError}</p>}
            <h1 className="text-white mb-2">{user.name}</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRoleBadgeColor(displayRole)}`}>
              <Shield className="w-4 h-4" />
              <span className="capitalize">{displayRole}</span>
              {displayRole === 'organizer' && Boolean(user.organizer_verified) && (
                <CheckCircle2 className="w-4 h-4 text-sky-500" title="Verified organizer" />
              )}
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-slate-900 mb-6">Profile Settings</h2>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800">Profile updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="flex items-center gap-2 text-slate-700 mb-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="flex items-center gap-2 text-slate-700 mb-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 mb-1">Role Information</p>
                  <p className="text-amber-700">Your role is set to <span className="capitalize">{displayRole}</span>
              {displayRole === 'organizer' && Boolean(user.organizer_verified) && (
                <CheckCircle2 className="w-4 h-4 text-sky-500" title="Verified organizer" />
              )}. Contact an administrator to change your role.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-slate-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-600">Account Type</span>
              <span className="text-slate-900 capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-600">Member Since</span>
              <span className="text-slate-900">December 2025</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Account Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
