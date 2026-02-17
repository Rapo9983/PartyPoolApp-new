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
      
      // LOGICA CALCOLO PULITO (No Caffè nel Budget)
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

    channelRef.current = supabase.channel(`event-final-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, () => {
        loadEventData(false);
      })
      .subscribe();
  }, [event?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-black tracking-tighter text-2xl">CARICAMENTO...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-black">EVENTO NON TROVATO</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <Helmet><title>{`Party for ${event.celebrant_name}`}</title></Helmet>

      <div className="max-w-4xl mx-auto p-4 pt-8 pb-12">
        <div className="mb-6 flex justify-between items-center px-2">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600 font-black hover:text-gray-900 uppercase text-[10px] tracking-[0.2em] transition-all"><ArrowLeft className="w-4 h-4" /> Indietro</button>}
          {user?.id === event.creator_id && <button onClick={() => onEdit?.(event.id)} className="bg-orange-500 text-white px-6 py-2.5 rounded-full font-black flex items-center gap-2 shadow-lg hover:bg-orange-600 transition-all uppercase text-[10px] tracking-widest"><Edit className="w-4 h-4" /> Modifica</button>}
        </div>

        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-white/50">
          {/* Header Premium con Sfumatura Intensa */}
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 md:p-14 text-white relative">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-10 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                {event.celebrant_image ? (
                  <img src={event.celebrant_image} className="w-36 h-36 rounded-full border-[6px] border-white/30 shadow-2xl object-cover backdrop-blur-md" />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-white/20 border-[6px] border-white/30 flex items-center justify-center backdrop-blur-xl shadow-2xl"><Gift className="w-14 h-14 text-white" /></div>
                )}
                <div>
                  <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tighter drop-shadow-2xl uppercase leading-none">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 font-black">
                    <span className="flex items-center gap-2 bg-black/10 px-5 py-2 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-sm"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    {event.location && <span className="flex items-center gap-2 bg-black/10 px-5 py-2 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-sm"><MapPin className="w-4 h-4" /> {event.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowQRCode(true)} className="bg-white/10 p-5 rounded-[1.8rem] hover:bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl transition-all active:scale-90"><QrCode className="w-7 h-7" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/10 p-5 rounded-[1.8rem] hover:bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl transition-all active:scale-90"><Share2 className="w-7 h-7" /></button>
              </div>
            </div>

            {/* Box Progressi Glassmorphism Originale */}
            <div className="mt-14 bg-white/10 backdrop-blur-[40px] rounded-[2.8rem] p-8 md:p-12 border border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={120} /></div>
              <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mb-3 ml-1">Regali Ricevuti</p>
                  <span className="text-6xl font-black tracking-tighter drop-shadow-md">{formatCurrency(event.current_amount || 0, event.currency)}</span>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Obiettivo</p>
                  <span className="text-2xl font-black opacity-90 tracking-tight">{formatCurrency(event.budget_goal, event.currency)}</span>
                </div>
              </div>
              <div className="w-full bg-black/20 rounded-full h-9 overflow-hidden p-2 border border-white/10 shadow-inner relative z-10">
                <div className="bg-white h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_25px_rgba(255,255,255,0.8)]" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-8 relative z-10">
                <span className="bg-white/20 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-lg">{progressWidth.toFixed(1)}% Raggiunto</span>
                {totalCoffee > 0 && (
                  <div className="flex items-center gap-3 bg-yellow-400 text-orange-950 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.1em] shadow-[0_10px_20px_-5px_rgba(234,179,8,0.5)] animate-bounce">
                    <Coffee className="w-5 h-5" /> {totalCoffee} {totalCoffee === 1 ? 'Caffè offerto' : 'Caffè offerti'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sezione Pulsanti e Liste */}
          <div className="p-8 md:p-16 bg-white">
            <div className="grid sm:grid-cols-2 gap-8 mb-20">
              <button onClick={() => setShowContributeForm(true)} className="group bg-gradient-to-br from-orange-500 to-pink-600 text-white p-10 rounded-[2.2rem] font-black text-3xl shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(249,115,22,0.6)] hover:-translate-y-2 transition-all active:scale-95 uppercase tracking-tighter">Regala Ora</button>
              <button onClick={() => setShowWishForm(true)} className="group bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-10 rounded-[2.2rem] font-black text-3xl shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(234,179,8,0.6)] hover:-translate-y-2 transition-all active:scale-95 uppercase tracking-tighter">Fai gli Auguri</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-20">
              <section>
                <h3 className="flex items-center gap-4 text-4xl font-black text-gray-900 mb-12 uppercase tracking-tighter border-l-[12px] border-orange-500 pl-6 leading-none">Partecipanti</h3>
                <div className="space-y-5 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                  {contributions.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest text-[10px]">Nessun regalo ancora</div>
                  ) : (
                    contributions.map(c => (
                      <div key={c.id} className="bg-white border-2 border-gray-50 p-7 rounded-[1.8rem] flex justify-between items-center shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-2xl shadow-inner group-hover:scale-110 transition-transform">{c.contributor_name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="font-black text-gray-800 text-xl flex items-center gap-2 tracking-tight">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee className="w-5 h-5 text-orange-400" />}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-orange-600 font-black text-3xl tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-4 text-4xl font-black text-gray-900 mb-12 uppercase tracking-tighter border-l-[12px] border-pink-500 pl-6 leading-none">Auguri</h3>
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                  {wishes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest text-[10px]">Ancora nessun augurio</div>
                  ) : (
                    wishes.map(w => (
                      <div key={w.id} className="bg-pink-50/40 border-2 border-pink-100/50 p-10 rounded-[2.5rem] shadow-sm relative group hover:bg-pink-50 transition-colors">
                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-pink-100 group-hover:rotate-12 transition-transform"><MessageSquare className="text-pink-500" size={24} /></div>
                        <div className="font-black text-pink-600 text-[10px] uppercase tracking-[0.4em] mb-5">{w.author_name}</div>
                        <p className="text-gray-700 italic font-bold text-xl leading-snug">"{w.message}"</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showContributeForm && <ContributionForm eventId={event.id} currency={event.currency} budgetGoal={event.budget_goal} paypalEmail={event.paypal_email} satispayId={event.satispay_id} onClose={() => setShowContributeForm(false)} onSuccess={() => setShowContributeForm(false)} />}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => setShowWishForm(false)} />}
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
      <Footer />
    </div>
  );
}
