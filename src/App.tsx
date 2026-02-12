import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CreateEvent from './components/CreateEvent';
import EditEvent from './components/EditEvent';
import EventDashboard from './components/EventDashboard';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import Navbar from './components/Navbar';

type View = 'landing' | 'auth' | 'dashboard' | 'create-event' | 'edit-event' | 'view-event' | 'privacy-policy';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [eventSlug, setEventSlug] = useState<string | null>(null);
  const [eventIdToEdit, setEventIdToEdit] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/event/')) {
      const slug = path.split('/event/')[1];
      if (slug) {
        setEventSlug(slug);
        setView('view-event');
      }
    } else if (path === '/privacy') {
      setView('privacy-policy');
    } else if (user) {
      setView('dashboard');
    } else {
      setView('landing');
    }
  }, [user]);

  const handleViewEvent = (slug: string) => {
    setEventSlug(slug);
    setView('view-event');
    window.history.pushState({}, '', `/event/${slug}`);
  };

  const handleEventCreated = (slug: string) => {
    handleViewEvent(slug);
  };

  const handleBackToDashboard = () => {
    if (user) {
      setView('dashboard');
      setEventSlug(null);
      window.history.pushState({}, '', '/');
    } else {
      setView('landing');
      setEventSlug(null);
      window.history.pushState({}, '', '/');
    }
  };

  const handleGetStarted = () => {
    setView('auth');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  const handleEditEvent = (eventId: string) => {
    setEventIdToEdit(eventId);
    setView('edit-event');
  };

  const handleEventUpdated = (slug: string) => {
    handleViewEvent(slug);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (view === 'privacy-policy') {
    return (
      <>
        <Navbar
          onSignInClick={handleGetStarted}
          onDashboardClick={user ? handleBackToDashboard : handleBackToLanding}
        />
        <div className="pt-20">
          <PrivacyPolicy onBack={user ? handleBackToDashboard : handleBackToLanding} />
        </div>
      </>
    );
  }

  if (view === 'view-event' && eventSlug) {
    return (
      <>
        <Navbar
          onSignInClick={handleGetStarted}
          onDashboardClick={handleBackToDashboard}
        />
        <div className="pt-20">
          <EventDashboard
            slug={eventSlug}
            onBack={handleBackToDashboard}
            onEdit={user ? handleEditEvent : undefined}
          />
        </div>
      </>
    );
  }

  if (!user) {
    if (view === 'auth') {
      return (
        <>
          <Navbar
            onSignInClick={handleGetStarted}
            onDashboardClick={handleBackToLanding}
          />
          <div className="pt-20">
            <Auth />
          </div>
        </>
      );
    }

    return (
      <>
        <Navbar
          onSignInClick={handleGetStarted}
          onDashboardClick={handleBackToLanding}
        />
        <div className="pt-20">
          <LandingPage onGetStarted={handleGetStarted} />
        </div>
      </>
    );
  }

  if (view === 'create-event') {
    return (
      <>
        <Navbar
          onSignInClick={handleGetStarted}
          onDashboardClick={handleBackToDashboard}
        />
        <div className="pt-20">
          <CreateEvent
            onEventCreated={handleEventCreated}
            onBack={handleBackToDashboard}
          />
        </div>
      </>
    );
  }

  if (view === 'edit-event' && eventIdToEdit) {
    return (
      <>
        <Navbar
          onSignInClick={handleGetStarted}
          onDashboardClick={handleBackToDashboard}
        />
        <div className="pt-20">
          <EditEvent
            eventId={eventIdToEdit}
            onEventUpdated={handleEventUpdated}
            onBack={handleBackToDashboard}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar
        onSignInClick={handleGetStarted}
        onDashboardClick={handleBackToDashboard}
      />
      <div className="pt-20">
        <Dashboard
          onCreateEvent={() => setView('create-event')}
          onViewEvent={handleViewEvent}
          onEditEvent={handleEditEvent}
        />
      </div>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
