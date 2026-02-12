import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Event } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/utils';
import { Plus, Calendar, DollarSign, LogOut, Gift, ExternalLink, Trash2, Edit } from 'lucide-react';
import Footer from './Footer';
import GoalReachedModal from './GoalReachedModal';
import InstallPWABanner from './InstallPWABanner';

interface DashboardProps {
  onCreateEvent: () => void;
  onViewEvent: (slug: string) => void;
  onEditEvent: (eventId: string) => void;
}

export default function Dashboard({ onCreateEvent, onViewEvent, onEditEvent }: DashboardProps) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showGoalReachedModal, setShowGoalReachedModal] = useState(false);
  const [goalReachedEvent, setGoalReachedEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, [user]);

  useEffect(() => {
    if (events.length > 0) {
      checkForGoalReached();
    }
  }, [events]);

  const loadEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForGoalReached = () => {
    const seenGoals = JSON.parse(localStorage.getItem('goalReachedSeen') || '{}');

    const reachedEvent = events.find(event => {
      const hasReachedGoal = event.current_amount >= event.budget_goal;
      const notSeenYet = !seenGoals[event.id];
      return hasReachedGoal && notSeenYet;
    });

    if (reachedEvent) {
      setGoalReachedEvent(reachedEvent);
      setShowGoalReachedModal(true);
    }
  };

  const handleCloseGoalModal = () => {
    if (goalReachedEvent) {
      const seenGoals = JSON.parse(localStorage.getItem('goalReachedSeen') || '{}');
      seenGoals[goalReachedEvent.id] = true;
      localStorage.setItem('goalReachedSeen', JSON.stringify(seenGoals));
    }

    setShowGoalReachedModal(false);
    setGoalReachedEvent(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm(t('dashboard.confirmDelete'))) {
      return;
    }

    setDeletingId(eventId);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                {t('app.name')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="w-5 h-5" />
                {t('dashboard.signOut')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h2>
            <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <button
            onClick={onCreateEvent}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('dashboard.createEvent')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.noEvents')}</h3>
            <p className="text-gray-600 mb-6">{t('dashboard.noEventsDesc')}</p>
            <button
              onClick={onCreateEvent}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('dashboard.firstEvent')}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer relative"
                onClick={() => onViewEvent(event.slug)}
              >
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-6">
                  {event.is_supporter && (
                    <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
                      <Gift className="w-4 h-4 text-white" />
                      <span className="text-xs font-semibold text-white">{t('piggybank.supporterBadge')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-white flex-1">{event.celebrant_name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event.id);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                        title={t('dashboard.editEvent')}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteEvent(event.id, event.celebrant_name, e)}
                        disabled={deletingId === event.id}
                        className="bg-white/20 hover:bg-red-500 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('dashboard.deleteEvent')}
                      >
                        {deletingId === event.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-orange-600 font-semibold">
                      {t('dashboard.goal')}: {formatCurrency(Number(event.budget_goal), event.currency)}
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer onCreateEventClick={onCreateEvent} />

      <InstallPWABanner />

      {showGoalReachedModal && goalReachedEvent && (
        <GoalReachedModal
          celebrantName={goalReachedEvent.celebrant_name}
          onClose={handleCloseGoalModal}
        />
      )}
    </div>
  );
}
