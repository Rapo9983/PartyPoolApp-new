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
      const { data: eventData, error: eventError } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
      if (eventError || !eventData) throw eventError;

      const [contributionsRes, wishesRes] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
        supabase.from('wishes').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false })
      ]);

      setEvent({ ...eventData, budget_goal: Number(eventData.budget_goal) || 0, current_amount: Number(eventData.current_amount) || 0 });
      setContributions(contributionsRes.data || []);
      setWishes(wishesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [slug]);

  // Realtime con blocco raddoppio
  useEffect(() => {
    if (!event?.id) return;
    if (channelRef.current) return; // Evita sottoscrizioni multiple

    channelRef.current = supabase.channel(`event-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${event.id}` }, (payload) => {
         const updated = payload.new as any;
         setEvent(prev => prev ? { ...prev, current_amount: Number(updated.current_amount) } : null);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, () => {
         loadEventData(false); // Ricarica liste senza spinner
      })
      .subscribe();
  }, [event?.id]);

  useEffect(() => {
    if (event) {
      const percentage = event.budget_goal > 0 ? Math.min((event.current_amount / event.budget_goal) * 100, 100) : 0;
      setProgressWidth(percentage);
    }
  }, [event?.current_amount, event?.budget_goal]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-bold">Caricamento...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold">Evento non trovato</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <Helmet><title>{`Party per ${event.celebrant_name}`}</title></Helmet>
      <div className="max-w-4xl mx-auto p-4 pt-8 pb-12">
        <div className="mb-6 flex justify-between items-center">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600 font-bold hover:text-gray-900"><ArrowLeft className="w-5 h-5" /> Indietro</button>}
          {user?.id === event.creator_id && onEdit && <button onClick={() => onEdit(event.id)} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Edit className="w-4 h-4" /> Modifica</button>}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50">
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 md:p-12 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {event.celebrant_image ? <img src={event.celebrant_image} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover" /> : <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-md"><Gift className="w-12 h-12" /></div>}
                <div>
                  <h1 className="text-5xl font-black mb-2 tracking-tighter drop-shadow-md">{event.celebrant_name}</h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 font-bold opacity-90">
                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    {event.location && <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs"><MapPin className="w-4 h-4" /> {event.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md border border-white/10"><QrCode className="w-6 h-6" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); }} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md border border-white/10"><Share2 className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="mt-10 bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20 shadow-2xl">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Raccolta Fondi</p>
                  <span className="text-4xl font-black">{formatCurrency(event.current_amount, event.currency)}</span>
                </div>
                <div className="text-right"><span className="text-sm font-black opacity-70 uppercase tracking-tighter">Target: {formatCurrency(event.budget_goal, event.currency)}</span></div>
              </div>
              <div className="w-full bg-black/10 rounded-full h-6 overflow-hidden p-1.5 border border-white/10 shadow-inner">
                <div className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between items-center mt-4 font-black text-[10px] uppercase tracking-widest">
                <span className="bg-white/20 px-3 py-1 rounded-full">{progressWidth.toFixed(1)}% Raggiunto</span>
                {totalCoffee > 0 && <span className="flex items-center gap-1.5 bg-yellow-400 text-orange-900 px-4 py-1.5 rounded-full shadow-lg animate-bounce"><Coffee className="w-4 h-4" /> {totalCoffee} Caffè offerti</span>}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <button onClick={() => setShowContributeForm(true)} className="bg-gradient-to-br from-orange-500 to-pink-500 text-white p-6 rounded-[1.5rem] font-black text-xl shadow-xl hover:-translate-y-1 transition-all active:scale-95">Regala Ora</button>
              <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6 rounded-[1.5rem] font-black text-xl shadow-xl hover:-translate-y-1 transition-all active:scale-95">Fai gli Auguri</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <section>
                <h3 className="flex items-center gap-3 text-2xl font-black text-gray-800 mb-8 uppercase tracking-tighter"><Users className="text-orange-500 w-7 h-7" /> Partecipanti</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {contributions.length === 0 ? <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold">Ancora nessun regalo</div> : 
                    contributions.map(c => (
                      <div key={c.id} className="bg-white border border-gray-100 p-5 rounded-2xl flex justify-between items-center shadow-sm">
                        <div className="font-black text-gray-800 flex items-center gap-2">{c.contributor_name} {Number(c.support_amount) > 0 && <Coffee className="w-4 h-4 text-orange-400" />}</div>
                        <div className="text-orange-600 font-black text-xl">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                      </div>
                    ))}
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-3 text-2xl font-black text-gray-800 mb-8 uppercase tracking-tighter"><MessageSquare className="text-pink-500 w-7 h-7" /> Auguri</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {wishes.length === 0 ? <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold">Nessun augurio ancora</div> : 
                    wishes.map(w => (
                      <div key={w.id} className="bg-pink-50/50 border border-pink-100 p-6 rounded-[1.5rem]">
                        <div className="font-black text-pink-600 text-[10px] uppercase mb-2 tracking-widest">{w.author_name}</div>
                        <p className="text-gray-700 italic font-bold leading-relaxed">"{w.message}"</p>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showContributeForm && <ContributionForm eventId={event.id} currency={event.currency} budgetGoal={event.budget_goal} paypalEmail={event.paypal_email} satispayId={event.satispay_id} onClose={() => setShowContributeForm(false)} onSuccess={() => { setShowContributeForm(false); }} />}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => setShowWishForm(false)} />}
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
      <Footer />
    </div>
  );
}
