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

export default function EventDashboard({ slug, onBack, onEdit }: { slug: string; onBack?: () => void; onEdit?: (id: string) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const channelRef = useRef<any>(null);

  const loadEventData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: eventData, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
      if (error || !eventData) return;

      const [contributionsRes, wishesRes] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
        supabase.from('wishes').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false })
      ]);

      const contrs = contributionsRes.data || [];
      const pureAmount = contrs.reduce((sum, c) => sum + (Number(c.base_amount) || 0), 0);
      const goal = Number(eventData.budget_goal) || 0;

      setEvent({ ...eventData, current_amount: pureAmount });
      setContributions(contrs);
      setWishes(wishesRes.data || []);
      setProgressWidth(goal > 0 ? Math.min((pureAmount / goal) * 100, 100) : 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [slug]);

  useEffect(() => {
    if (!event?.id || channelRef.current) return;
    channelRef.current = supabase.channel(`event-realtime-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, () => {
        loadEventData(false);
      })
      .subscribe();
  }, [event?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-medium">{t('common.loading')}</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-medium">Event not found</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet><title>{`Party for ${event.celebrant_name}`}</title></Helmet>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6 flex justify-between items-center">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
              <ArrowLeft className="w-5 h-5" /> {t('event.backButton')}
            </button>
          )}
          {user?.id === event.creator_id && (
            <button onClick={() => onEdit?.(event.id)} className="bg-white text-gray-700 px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all font-semibold">
              <Edit className="w-4 h-4" /> {t('dashboard.editEvent')}
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header con Sfondo Gradiente Coerente */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                {event.celebrant_image ? (
                  <img src={event.celebrant_image} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white/20 object-cover shadow-lg" />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                      <Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        <MapPin className="w-4 h-4" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/10 shadow-sm"><QrCode className="w-6 h-6" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/10 shadow-sm"><Share2 className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="mt-10 bg-black/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-end mb-3 font-semibold">
                <span className="text-2xl md:text-3xl">{formatCurrency(event.current_amount || 0, event.currency)}</span>
                <span className="text-white/80 text-sm">{t('common.of')} {formatCurrency(event.budget_goal, event.currency)}</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-4 overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-3 text-xs font-bold uppercase tracking-wider">
                <span>{progressWidth.toFixed(0)}% {t('event.reached')}</span>
                {totalCoffee > 0 && (
                  <span className="flex items-center gap-1 bg-yellow-400 text-orange-900 px-3 py-1 rounded-full shadow-md animate-pulse">
                    <Coffee className="w-3.5 h-3.5" /> {totalCoffee} {t('event.contributions')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <button onClick={() => setShowContributeForm(true)} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-0.5 transition-all active:scale-95">{t('event.contribute')}</button>
              <button onClick={() => setShowWishForm(true)} className="bg-white text-orange-600 border-2 border-orange-100 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all active:scale-95">{t('event.leaveWish')}</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contributions List */}
              <section>
                <div className="flex items-center gap-2 mb-6 text-gray-800">
                  <Users className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold tracking-tight">{t('event.contributions')}</h3>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {contributions.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400 font-medium border-2 border-dashed border-gray-100 italic">{t('event.noContributions')}</div>
                  ) : (
                    contributions.map(c => (
                      <div key={c.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:border-orange-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-bold uppercase">{c.contributor_name.charAt(0)}</div>
                          <span className="font-semibold text-gray-700">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee className="w-4 h-4 text-orange-400 inline ml-1" />}</span>
                        </div>
                        <span className="font-bold text-orange-600">{formatCurrency(Number(c.base_amount), event.currency)}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Wishes List */}
              <section>
                <div className="flex items-center gap-2 mb-6 text-gray-800">
                  <MessageSquare className="w-6 h-6 text-pink-500" />
                  <h3 className="text-xl font-bold tracking-tight">{t('event.wishes')}</h3>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {wishes.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400 font-medium border-2 border-dashed border-gray-100 italic">{t('event.noWishes')}</div>
                  ) : (
                    wishes.map(w => (
                      <div key={w.id} className="bg-pink-50/50 border border-pink-100/50 p-5 rounded-2xl relative">
                        <span className="block font-bold text-pink-600 text-xs uppercase mb-2 tracking-wider">{w.author_name}</span>
                        <p className="text-gray-700 italic leading-relaxed">"{w.message}"</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showContributeForm && <ContributionForm eventId={event.id} currency={event.currency} budgetGoal={event.budget_goal} paypalEmail={event.paypal_email} satispayId={event.satispay_id} onClose={() => setShowContributeForm(false)} onSuccess={() => { setShowContributeForm(false); loadEventData(false); }} />}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => { setShowWishForm(false); loadEventData(false); }} />}
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
      <Footer />
    </div>
  );
}
