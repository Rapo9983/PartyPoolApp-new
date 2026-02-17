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

      if (eventError || !eventData) {
        setLoading(false);
        return;
      }

      // Sanificazione dati numerici per evitare crash
      const sanitizedEvent = {
        ...eventData,
        budget_goal: Math.round((Number(eventData.budget_goal) || 0) * 100) / 100,
        current_amount: Math.round((Number(eventData.current_amount) || 0) * 100) / 100,
      };

      setEvent(sanitizedEvent);

      const [contributionsRes, wishesRes] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
        supabase.from('wishes').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false })
      ]);

      setContributions(contributionsRes.data || []);
      setWishes(wishesRes.data || []);
    } catch (error) {
      console.error('Crash durante il caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    
    // Cleanup del canale quando si cambia pagina o si chiude
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [slug]);

  // Gestione Realtime sicura
  useEffect(() => {
    if (!event?.id) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`event-${event.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` }, 
        (payload) => {
          const updated = payload.new as any;
          setEvent(prev => prev ? {
            ...prev,
            current_amount: Math.round((Number(updated.current_amount) || 0) * 100) / 100,
            budget_goal: Math.round((Number(updated.budget_goal) || 0) * 100) / 100
          } : null);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` }, 
        () => loadEventData(false)
      )
      .subscribe();

    channelRef.current = channel;
  }, [event?.id]);

  // Animazione barra
  useEffect(() => {
    if (event) {
      const goal = Number(event.budget_goal) || 0;
      const current = Number(event.current_amount) || 0;
      const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
      setProgressWidth(percentage);
    }
  }, [event?.current_amount, event?.budget_goal]);

  const handleContributionAdded = () => {
    setShowContributeForm(false);
    setTimeout(() => loadEventData(false), 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-bold">Caricamento...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold">Evento non trovato.</div>;

  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);
  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet><title>{event.celebrant_name} - Party</title></Helmet>
      
      <div className="max-w-4xl mx-auto p-4 pt-8 pb-12">
        <div className="mb-6 flex justify-between items-center">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600"><ArrowLeft className="w-5 h-5" /> Indietro</button>}
          {isCreator && onEdit && <button onClick={() => onEdit(event.id)} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Edit className="w-4 h-4" /> Modifica</button>}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
              {event.celebrant_image ? (
                <img src={event.celebrant_image} className="w-24 h-24 rounded-full border-4 border-white object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center"><Gift className="w-10 h-10" /></div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-black">{event.celebrant_name}</h1>
                <p className="flex items-center justify-center sm:justify-start gap-2 opacity-90"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-3 rounded-xl hover:bg-white/30"><QrCode className="w-5 h-5" /></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copiato!"); }} className="bg-white/20 p-3 rounded-xl hover:bg-white/30"><Share2 className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-black">{formatCurrency(currentAmount, event.currency || 'EUR')}</span>
                <span className="text-sm opacity-80">Obiettivo: {formatCurrency(budgetGoal, event.currency || 'EUR')}</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-4 overflow-hidden mb-2">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span>{progressWidth.toFixed(0)}% Completato</span>
                {totalCoffee > 0 && <span className="text-yellow-300">☕ {totalCoffee} Caffè offerti</span>}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={() => setShowContributeForm(true)} className="bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition">Regala ora</button>
              <button onClick={() => setShowWishForm(true)} className="bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition">Fai gli auguri</button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h3 className="flex items-center gap-2 font-bold mb-4 text-gray-800"><Users className="w-5 h-5 text-orange-500" /> Partecipanti ({contributions.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {contributions.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
                      <span className="font-bold text-sm text-gray-700">{c.contributor_name}</span>
                      <span className="font-black text-orange-600">{formatCurrency(Number(c.base_amount), event.currency || 'EUR')}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="flex items-center gap-2 font-bold mb-4 text-gray-800"><MessageSquare className="w-5 h-5 text-pink-500" /> Auguri ({wishes.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {wishes.map(w => (
                    <div key={w.id} className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                      <p className="text-xs font-bold text-pink-600 mb-1">{w.author_name}</p>
                      <p className="text-sm italic text-gray-600">"{w.message}"</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {showContributeForm && (
        <ContributionForm 
          eventId={event.id} 
          currency={event.currency || 'EUR'} 
          budgetGoal={event.budget_goal} 
          paypalEmail={event.paypal_email} 
          satispayId={event.satispay_id} 
          onClose={() => setShowContributeForm(false)} 
          onSuccess={handleContributionAdded} 
        />
      )}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => { setShowWishForm(false); loadEventData(false); }} />}
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
    </div>
  );
}
