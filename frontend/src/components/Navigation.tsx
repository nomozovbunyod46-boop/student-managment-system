import { Calendar, User, LogOut, LayoutDashboard, Plus, List } from 'lucide-react';
import { useAuth } from './AuthContext';
import logo from '../assets/logo.jpg';
import { resolvePublicImageUrl } from '../lib/userApi';


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
  | 'profile'
  | 'public-profile';

interface NavigationProps {
  onNavigate: (page: Page, id?: number) => void;
  currentPage?: Page;
  variant?: 'light' | 'dark';
}

export default function Navigation({ onNavigate, currentPage, variant = 'light' }: NavigationProps) {
  const { user, logout } = useAuth();
  const isDark = variant === 'dark';

  const handleLogout = () => {
    logout();
    onNavigate('events');
  };

  return (
    <nav
      className={
        isDark
          ? 'bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50'
          : 'bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50 shadow-sm'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* LOGO (EventHub o‘rniga butunlay logo) */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center group"
          >
            <img
              src={logo}
              alt="EventHub"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </button>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className={
                    isDark
                      ? 'px-4 py-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50'
                      : 'px-4 py-2 text-slate-700 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-50'
                  }
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className={
                    isDark
                      ? 'px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors'
                      : 'px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all'
                  }
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('events')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? currentPage === 'events'
                        ? 'bg-slate-700 text-teal-300'
                        : 'text-slate-300 hover:bg-slate-700/50'
                      : currentPage === 'events'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>

                {(user.role === 'participant' || user.role === 'verified_user') && (
                  <button
                    onClick={() => onNavigate('my-events')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isDark
                        ? currentPage === 'my-events'
                          ? 'bg-slate-700 text-teal-300'
                          : 'text-slate-300 hover:bg-slate-700/50'
                        : currentPage === 'my-events'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                )}

                {Boolean(user.is_organizer) && (
                  <>
                    <button
                      onClick={() => onNavigate('create-event')}
                      className={
                        isDark
                          ? 'px-3 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors flex items-center gap-2'
                          : 'px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2'
                      }
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Create Event</span>
                    </button>
                    <button
                      onClick={() => onNavigate('organizer-dashboard')}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isDark
                          ? currentPage === 'organizer-dashboard'
                            ? 'bg-slate-700 text-teal-300'
                            : 'text-slate-300 hover:bg-slate-700/50'
                          : currentPage === 'organizer-dashboard'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </button>
                  </>
                )}

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <>
                    <button
                      onClick={() => onNavigate('create-event')}
                      className={
                        isDark
                          ? 'px-3 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors flex items-center gap-2'
                          : 'px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2'
                      }
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Create Event</span>
                    </button>
                    <button
                      onClick={() => onNavigate('admin-dashboard')}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isDark
                          ? currentPage === 'admin-dashboard'
                            ? 'bg-slate-700 text-teal-300'
                            : 'text-slate-300 hover:bg-slate-700/50'
                          : currentPage === 'admin-dashboard'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* User Menu */}
                <div className={`flex items-center gap-2 ml-2 pl-2 border-l ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                  <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full overflow-hidden flex items-center justify-center">
  {user.avatar_url ? (
    <img
      src={resolvePublicImageUrl(user.avatar_url)}
      className="w-full h-full object-cover"
      alt={user.name}
    />
  ) : (
    <User className="w-4 h-4 text-white" />
  )}
</div>

                    <span className={`hidden sm:inline ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{user.name}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'}`}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
