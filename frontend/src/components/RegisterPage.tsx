import { useState } from 'react';
import { Calendar, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { useAuth, AppRole } from './AuthContext';
import { apiRegister } from '../lib/authApi';

type Page = 'login' | 'register' | 'events' | 'event-detail' | 'create-event' | 'organizer-dashboard' | 'admin-dashboard' | 'my-events' | 'profile' | 'public-profile';

interface RegisterPageProps {
  onNavigate: (page: Page) => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Ism kiriting');
      return;
    }
    if (password.length < 8) {
      setError('Parol kamida 8 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiRegister(name.trim(), email.trim(), password, role);
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      await refreshUser();
      onNavigate('events');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Tasdiqlash yoki ro‘yxatdan o‘tishda xatolik';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-slate-600">
            Oddiy ro‘yxatdan o‘tish formasi
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-slate-700 mb-2">To‘liq ism</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-slate-700 mb-2">Parol (kamida 8 belgi)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-3">Ro‘yxatdan o‘tish turi:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('participant')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    role === 'participant'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Participant
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    role === 'organizer'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Organizer
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Yaratilmoqda...' : 'Hisob yaratish'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Hisobingiz bormi?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('events')}
            className="text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
