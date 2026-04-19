import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import EventListPage from './components/EventListPage';
import EventDetailPage from './components/EventDetailPage';
import CreateEventPage from './components/CreateEventPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import AdminDashboard from './components/AdminDashboard';
import MyEventsPage from './components/MyEventsPage';
import ProfilePage from './components/ProfilePage';
import PublicProfilePage from './components/PublicProfilePage';

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

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { user } = useAuth();

  const navigateTo = (page: Page, id?: number) => {
    setCurrentPage(page);

    // event related pages
    if (page === 'event-detail' || page === 'create-event') {
      if (id !== undefined) setSelectedEventId(id);
      // ✅ Create Event bosilganda eski eventId qolib ketmasin
      if (page === 'create-event' && id === undefined) setSelectedEventId(null);
      return;
    }

    // public profile
    if (page === 'public-profile') {
      setSelectedUserId(id ?? null);
      return;
    }
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={navigateTo} />;
      case 'register':
        return <RegisterPage onNavigate={navigateTo} />;
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'events':
        return <EventListPage onNavigate={navigateTo} />;
      case 'event-detail':
        return <EventDetailPage eventId={selectedEventId} onNavigate={navigateTo} />;
      case 'create-event':
        return <CreateEventPage onNavigate={navigateTo} eventId={selectedEventId} />;
      case 'organizer-dashboard':
        return <OrganizerDashboard onNavigate={navigateTo} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigateTo} />;
      case 'my-events':
        return <MyEventsPage onNavigate={navigateTo} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} />;
      case 'public-profile':
        return <PublicProfilePage onNavigate={navigateTo} userId={selectedUserId} backEventId={selectedEventId} />;
      default:
        return <EventListPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {renderPage()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
