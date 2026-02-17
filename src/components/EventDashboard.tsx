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
      
      // CALCOLO PURO: Sommiamo solo i base_amount per il budget, ignorando i caffè
      const pureAmount = contrs.reduce((sum, c) => sum + (Number(c.base_amount) || 0), 0);
      const goal = Number(eventData.budget_goal) || 0;

      setEvent({ ...eventData, current_amount: pureAmount }); // Sovrascriviamo il totale con quello calcolato dai base_amount
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

  // Realtime "Intelligente": Non aggiorna tutto, ma scatena il ricaricamento dei dati puliti
  useEffect(() => {
    if (!event?.id || channelRef.current) return;

    channelRef.current = supabase.channel(`event-v3-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, () => {
        // Quando cambia un contributo, ricarichiamo tutto per ricalcolare le somme correttamente
        loadEventData(false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` }, (payload) => {
        // Se cambia l'obiettivo (budget_goal), aggiorniamo l'evento
        const updated = payload.new as Event;
        setEvent(prev => prev ? { ...prev, budget_goal: updated.budget_goal } : null);
      })
      .subscribe();
  }, [event?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-black">CARICAMENTO...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-black">EVENTO NON TROVATO</div>;

  // Calcolo caffè totale per il badge giallo
  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);
  const currentAmount = event.current_amount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <Helmet><title>{`Party per ${event.celebrant_name}`}</title></Helmet>
      <div className="max-w-4xl mx-auto p-4 pt-8 pb-12">
        
        <div className="mb-6 flex justify-between items-center">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600 font-black hover:text-gray-900 uppercase text-xs tracking-widest"><ArrowLeft className="w-5 h-5" /> Indietro</button>}
          {user?.id === event.creator_id && <button onClick={() => onEdit?.(event.id)} className="bg-orange-500 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg hover:bg-orange-600 transition uppercase text-xs tracking-widest"><Edit className="w-4 h-4" /> Modifica</button>}
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/50">
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 md:p-12 text-white relative">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {event.celebrant_image ? (
                  <img src={event.celebrant_image} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-md"><Gift className="w-12 h-12" /></div>
                )}
                <div>
                  <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter drop-shadow-xl uppercase">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 font-black opacity-90">
                    <span className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-md"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-4 rounded-[1.5rem] hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-xl transition-all"><QrCode className="w-6 h-6" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/20 p-4 rounded-[1.5rem] hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-xl transition-all"><Share2 className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Box Budget Corretto: Mostra currentAmount che ora è solo la somma dei regali (base_amount) */}
            <div className="mt-12 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Budget Regali</p>
                  <span className="text-5xl font-black tracking-tighter">{formatCurrency(currentAmount, event.currency)}</span>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1 text-right">Obiettivo</p>
                  <span className="text-xl font-black opacity-90">{formatCurrency(event.budget_goal, event.currency)}</span>
                </div>
              </div>
              <div className="w-full bg-black/20 rounded-full h-8 overflow-hidden p-2 border border-white/10 shadow-inner">
                <div className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.6)]" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-6">
                <span className="bg-white/20 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md border border-white/10">{progressWidth.toFixed(1)}% COMPLETATO</span>
                {totalCoffee > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-400 text-orange-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl animate-bounce">
                    <Coffee className="w-4 h-4" /> {totalCoffee} {totalCoffee === 1 ? 'Caffè offerto' : 'Caffè offerti'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-16">
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              <button onClick={() => setShowContributeForm(true)} className="bg-gradient-to-br from-orange-500 to-pink-600 text-white p-8 rounded-[2rem] font-black text-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-tighter">Regala Ora</button>
              <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-8 rounded-[2rem] font-black text-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-tighter">Fai gli Auguri</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-16">
              <section>
                <h3 className="text-3xl font-black text-gray-800 mb-10 uppercase tracking-tighter border-l-8 border-orange-500 pl-4">Partecipanti</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {contributions.map(c => (
                    <div key={c.id} className="bg-white border-2 border-gray-50 p-6 rounded-[1.5rem] flex justify-between items-center shadow-sm hover:border-orange-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl">{c.contributor_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-black text-gray-800 text-lg flex items-center gap-2">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee className="w-4 h-4 text-orange-400" />}</div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{new Date(c.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-orange-600 font-black text-2xl tracking-tighter">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-black text-gray-800 mb-10 uppercase tracking-tighter border-l-8 border-pink-500 pl-4">Auguri</h3>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {wishes.map(w => (
                    <div key={w.id} className="bg-pink-50/30 border-2 border-pink-100/50 p-8 rounded-[2rem]">
                      <div className="font-black text-pink-600 text-[10px] uppercase tracking-[0.3em] mb-4">{w.author_name}</div>
                      <p className="text-gray-700 italic font-bold text-lg leading-relaxed">"{w.message}"</p>
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
