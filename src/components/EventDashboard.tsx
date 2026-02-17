import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, Event, Contribution, Wish } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { Calendar, Users, MessageSquare, Share2, ArrowLeft, MapPin, Gift, QrCode, Edit, Coffee } from 'lucide-react';
import ContributionForm from './ContributionForm';
import WishForm from './WishForm';
import QRCodeModal from './QRCodeModal';
import Footer from './Footer';

interface EventDashboardProps {
  slug: string;
  onBack?: () => void;
  onEdit?: (eventId: string) => void;
}

export default function EventDashboard({ slug, onBack, onEdit }: EventDashboardProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const channelRef = useRef<any>(null);

  const isCreator = user && event ? user.id === event.creator_id : false;

  const loadEventData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (eventError || !eventData) throw eventError;

      setEvent({
        ...eventData,
        budget_goal: Number(eventData.budget_goal) || 0,
        current_amount: Number(eventData.current_amount) || 0,
      });

      const [contributionsRes, wishesRes] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
        supabase.from('wishes').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false })
      ]);

      setContributions(contributionsRes.data || []);
      setWishes(wishesRes.data || []);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [slug]);

  useEffect(() => {
    if (!event?.id) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`event-updates-${event.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` }, 
        (payload) => {
          const updated = payload.new as any;
          setEvent(prev => prev ? {
            ...prev,
            current_amount: Number(updated.current_amount),
            budget_goal: Number(updated.budget_goal)
          } : null);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, 
        () => loadEventData(false)
      )
      .subscribe();

    channelRef.current = channel;
  }, [event?.id]);

  useEffect(() => {
    if (event) {
      const goal = Number(event.budget_goal) || 0;
      const current = Number(event.current_amount) || 0;
      const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
      setProgressWidth(percentage);
    }
  }, [event?.current_amount, event?.budget_goal]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-bold">{t('common.loading')}</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold">Event not found</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);
  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <Helmet><title>{`Party for ${event.celebrant_name}`}</title></Helmet>

      <div className="max-w-4xl mx-auto p-4 pt-8 pb-12">
        <div className="mb-6 flex justify-between items-center">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"><ArrowLeft className="w-5 h-5" /> {t('event.backButton')}</button>}
          {isCreator && onEdit && <button onClick={() => onEdit(event.id)} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"><Edit className="w-5 h-5" /> {t('dashboard.editEvent')}</button>}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Header Premium */}
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {event.celebrant_image ? (
                  <img src={event.celebrant_image} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-md"><Gift className="w-12 h-12 text-white" /></div>
                )}
                <div>
                  <h1 className="text-4xl font-black mb-2 drop-shadow-sm">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-white/90 font-medium">
                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    {event.location && <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm"><MapPin className="w-4 h-4" /> {event.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md transition-all border border-white/10"><QrCode className="w-6 h-6" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md transition-all border border-white/10"><Share2 className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Progress Box Premium */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner">
              <div className="flex justify-between items-end mb-3">
                <span className="text-3xl font-black">{formatCurrency(currentAmount, event.currency)}</span>
                <span className="text-sm font-bold opacity-80">{t('common.of')} {formatCurrency(budgetGoal, event.currency)}</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-5 overflow-hidden p-1 border border-white/10">
                <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-3 font-black text-xs uppercase tracking-tighter">
                <span>{progressWidth.toFixed(1)}% {t('event.reached')}</span>
                {totalCoffee > 0 && <span className="bg-yellow-400 text-orange-900 px-3 py-1 rounded-full animate-bounce">☕ {totalCoffee} Caffè offerti</span>}
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="p-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <button onClick={() => setShowContributeForm(true)} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-5 rounded-2xl font-black text-lg hover:shadow-xl transition-all active:scale-95">{t('event.contribute')}</button>
              <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-5 rounded-2xl font-black text-lg hover:shadow-xl transition-all active:scale-95">{t('event.leaveWish')}</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <section>
                <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 mb-6 uppercase tracking-tight"><Users className="text-orange-500 w-6 h-6" /> {t('event.contributions')}</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {contributions.map(c => (
                    <div key={c.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="font-bold text-gray-800 flex items-center gap-2">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee className="w-4 h-4 text-orange-400" />}</div>
                      <div className="text-orange-600 font-black text-lg">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 mb-6 uppercase tracking-tight"><MessageSquare className="text-pink-500 w-6 h-6" /> {t('event.wishes')}</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {wishes.map(w => (
                    <div key={w.id} className="bg-pink-50/50 border border-pink-100 p-5 rounded-2xl">
                      <div className="font-black text-pink-600 text-xs uppercase mb-2">{w.author_name}</div>
                      <p className="text-gray-700 italic font-medium">"{w.message}"</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showContributeForm && (
        <ContributionForm 
          eventId={event.id} 
          currency={event.currency} 
          budgetGoal={event.budget_goal} 
          paypalEmail={event.paypal_email} 
          satispayId={event.satispay_id} 
          onClose={() => setShowContributeForm(false)} 
          onSuccess={() => { setShowContributeForm(false); loadEventData(false); }} 
        />
      )}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => { setShowWishForm(false); loadEventData(false); }} />}
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
      <Footer />
    </div>
  );
}
