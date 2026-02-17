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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-black text-2xl tracking-tighter uppercase">Caricamento...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-black">Evento non trovato</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Helmet><title>{`Party for ${event.celebrant_name}`}</title></Helmet>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8 flex justify-between items-center px-2">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={18} /> {t('event.backButton')}</button>}
          {user?.id === event.creator_id && <button onClick={() => onEdit?.(event.id)} className="bg-white text-gray-900 px-6 py-2.5 rounded-2xl shadow-sm border-2 border-gray-100 flex items-center gap-2 hover:border-orange-500 transition-all font-black uppercase text-[10px] tracking-widest"><Edit size={16} /> {t('dashboard.editEvent')}</button>}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100">
          {/* Header Black Design */}
          <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-orange-500 p-8 md:p-14 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                {event.celebrant_image ? (
                  <img src={event.celebrant_image} className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-white shadow-2xl object-cover" />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white/20 border-2 border-white/30 flex items-center justify-center backdrop-blur-md shadow-2xl"><Gift className="w-16 h-16" /></div>
                )}
                <div>
                  <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-[0.9]">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10"><Calendar size={14} /> {new Date(event.event_date).toLocaleDateString()}</span>
                    {event.location && <span className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10"><MapPin size={14} /> {event.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowQRCode(true)} className="bg-white/10 p-5 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 shadow-lg"><QrCode size={24} /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/10 p-5 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 shadow-lg"><Share2 size={24} /></button>
              </div>
            </div>

            {/* Budget Box - Glassmorphism Originale */}
            <div className="mt-14 bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('event.progress')}</p>
                  <span className="text-5xl md:text-6xl font-black tracking-tighter">{formatCurrency(event.current_amount || 0, event.currency)}</span>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Target</p>
                  <span className="text-xl font-black opacity-90">{formatCurrency(event.budget_goal, event.currency)}</span>
                </div>
              </div>
              <div className="w-full bg-black/20 rounded-full h-8 overflow-hidden p-1.5 border border-white/10 shadow-inner relative z-10">
                <div className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.6)]" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-6 relative z-10">
                <span className="bg-white/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-sm">{progressWidth.toFixed(1)}% {t('event.reached')}</span>
                {totalCoffee > 0 && (
                  <span className="flex items-center gap-2 bg-yellow-400 text-orange-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl animate-bounce">
                    <Coffee size={14} /> {totalCoffee} {totalCoffee === 1 ? 'Caffè' : 'Caffè'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-20">
              <button onClick={() => setShowContributeForm(true)} className="bg-orange-500 text-white px-8 py-8 rounded-[1.8rem] font-black text-2xl shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-tighter">{t('event.contribute')}</button>
              <button onClick={() => setShowWishForm(true)} className="bg-white text-gray-800 border-[3px] border-gray-100 px-8 py-8 rounded-[1.8rem] font-black text-2xl hover:border-pink-500 hover:text-pink-500 transition-all active:scale-95 uppercase tracking-tighter">{t('event.leaveWish')}</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-16">
              <section>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><Users size={20} /></div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{t('event.contributions')}</h3>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {contributions.map(c => (
                    <div key={c.id} className="bg-white border-2 border-gray-50 p-6 rounded-2xl flex justify-between items-center shadow-sm hover:border-orange-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-xl group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors uppercase">{c.contributor_name.charAt(0)}</div>
                        <div>
                          <span className="font-black text-gray-800 text-lg">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee size={16} className="text-orange-400 inline ml-1" />}</span>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="font-black text-orange-600 text-2xl tracking-tighter">{formatCurrency(Number(c.base_amount), event.currency)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600"><MessageSquare size={20} /></div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{t('event.wishes')}</h3>
                </div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {wishes.map(w => (
                    <div key={w.id} className="bg-pink-50/50 border-2 border-pink-100/20 p-8 rounded-[2rem] relative shadow-sm">
                      <span className="block font-black text-pink-600 text-[10px] uppercase tracking-[0.2em] mb-4">{w.author_name}</span>
                      <p className="text-gray-800 italic font-bold text-lg leading-relaxed">"{w.message}"</p>
                    </div>
                  ))}
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
