import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, Event, Contribution, Wish } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { extractImageFromUrl, formatCurrency } from '../lib/utils';
import { Calendar, Users, MessageSquare, Share2, ArrowLeft, MapPin, Gift, QrCode, Edit, Coffee, Wallet, CreditCard } from 'lucide-react';
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
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  // Ref per evitare sottoscrizioni multiple
  const channelRef = useRef<any>(null);

  const isCreator = user && event ? user.id === event.creator_id : false;

  const loadEventData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // 1. Carica dati evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) return;

      // Arrotondamento immediato dei dati dal DB
      const sanitizedEvent = {
        ...eventData,
        budget_goal: Math.round(Number(eventData.budget_goal) * 100) / 100,
        current_amount: Math.round(Number(eventData.current_amount) * 100) / 100,
      };
      setEvent(sanitizedEvent);

      // 2. Carica contributi e auguri
      const [contributionsRes, wishesRes] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false }),
        supabase.from('wishes').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false })
      ]);

      if (contributionsRes.data) setContributions(contributionsRes.data);
      if (wishesRes.data) setWishes(wishesRes.data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [slug]);

  // Gestione Realtime Unificata e Pulita
  useEffect(() => {
    if (!event?.id) return;

    // Se esiste già un canale attivo, lo chiudiamo prima di crearne uno nuovo
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`event-room-${event.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Event;
            setEvent(prev => prev ? {
              ...prev,
              current_amount: Math.round(Number(updated.current_amount) * 100) / 100,
              budget_goal: Math.round(Number(updated.budget_goal) * 100) / 100
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` },
        () => {
          // Ricarichiamo tutto per assicurarci che le liste siano sincronizzate col DB
          loadEventData(false);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [event?.id]);

  // Calcolo Percentuale e Animazione Barra
  useEffect(() => {
    if (event) {
      const goal = Number(event.budget_goal) || 0;
      const current = Number(event.current_amount) || 0;
      const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
      setProgressWidth(percentage);
    }
  }, [event?.current_amount, event?.budget_goal]);

  // Calcolo Totale Caffè (senza raddoppi)
  const totalCoffee = contributions.reduce((sum, c) => sum + (Number(c.support_amount) || 0), 0);

  const handleContributionAdded = () => {
    setShowContributeForm(false);
    loadEventData(false);
  };

  const handleWishAdded = () => {
    setShowWishForm(false);
    loadEventData(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `Party for ${event?.celebrant_name}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiato!');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center p-4">Evento non trovato</div>;

  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;
  const progressPercentage = budgetGoal > 0 ? Math.min((currentAmount / budgetGoal) * 100, 100) : 0;

  return (
    <>
      <Helmet>
        <title>{`Party for ${event.celebrant_name}`}</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto pt-8 pb-12">
          
          <div className="mb-6 flex justify-between items-center">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <ArrowLeft className="w-5 h-5" /> {t('event.backButton')}
              </button>
            )}
            {isCreator && (
              <div className="flex gap-2">
                {onEdit && (
                  <button onClick={() => onEdit(event.id)} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                    <Edit className="w-5 h-5" /> {t('dashboard.editEvent')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            {/* Banner Principale */}
            <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  {event.celebrant_image ? (
                    <img src={event.celebrant_image} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-md">
                      <Gift className="w-12 h-12 text-white" />
                    </div>
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
                  <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 border border-white/10"><QrCode className="w-6 h-6" /></button>
                  <button onClick={handleShare} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 border border-white/10"><Share2 className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Box Progress Bar */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{t('event.progress')}</p>
                    <span className="text-3xl font-black">{formatCurrency(currentAmount, event.currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold opacity-80">{t('common.of')} {formatCurrency(budgetGoal, event.currency)}</span>
                  </div>
                </div>
                
                <div className="w-full bg-black/10 rounded-full h-5 overflow-hidden p-1 shadow-inner border border-white/10">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase">{progressPercentage.toFixed(1)}% {t('event.reached')}</div>
                  {totalCoffee > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-400 text-orange-900 px-3 py-1 rounded-full text-xs font-black shadow-lg animate-bounce">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{totalCoffee} {totalCoffee === 1 ? 'CAFFÈ OFFERTO' : 'CAFFÈ OFFERTI'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Azioni e Liste */}
            <div className="p-8">
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <button onClick={() => setShowContributeForm(true)} className="group bg-gradient-to-r from-orange-500 to-pink-500 text-white p-5 rounded-2xl font-black text-lg hover:shadow-[0_10px_20px_-10px_rgba(249,115,22,0.5)] transition-all active:scale-95">
                  {t('event.contribute')}
                </button>
                <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-5 rounded-2xl font-black text-lg hover:shadow-[0_10px_20px_-10px_rgba(234,179,8,0.5)] transition-all active:scale-95">
                  {t('event.leaveWish')}
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-10">
                {/* Contributi */}
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 mb-6 uppercase tracking-tight">
                    <Users className="text-orange-500 w-6 h-6" /> {t('event.contributions')} 
                    <span className="ml-auto bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{contributions.length}</span>
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {contributions.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">Nessun contributo ancora</div>
                    ) : (
                      contributions.map(c => (
                        <div key={c.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:border-orange-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                              {c.contributor_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                {c.contributor_name}
                                {Number(c.support_amount) > 0 && <Coffee className="w-3.5 h-3.5 text-orange-400" />}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(c.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-600 font-black text-lg">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Auguri */}
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 mb-6 uppercase tracking-tight">
                    <MessageSquare className="text-pink-500 w-6 h-6" /> {t('event.wishes')}
                    <span className="ml-auto bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{wishes.length}</span>
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {wishes.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">Nessun augurio ancora</div>
                    ) : (
                      wishes.map(w => (
                        <div key={w.id} className="bg-pink-50/50 border border-pink-100 p-5 rounded-2xl relative shadow-sm">
                          <div className="font-black text-pink-600 text-xs uppercase mb-2 tracking-widest">{w.author_name}</div>
                          <p className="text-gray-700 italic leading-relaxed font-medium">"{w.message}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modali */}
        {showContributeForm && (
          <ContributionForm 
            eventId={event.id} 
            currency={event.currency} 
            budgetGoal={event.budget_goal} 
            paypalEmail={event.paypal_email} 
            satispayId={event.satispay_id}
            onClose={() => setShowContributeForm(false)} 
            onSuccess={handleContributionAdded} 
          />
        )}
        {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={handleWishAdded} />}
        {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
        <Footer />
      </div>
    </>
  );
}
