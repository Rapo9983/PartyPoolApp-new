import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, Event, Contribution, Wish } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { extractImageFromUrl, formatCurrency } from '../lib/utils';
import { addAmazonAffiliateTag, isAmazonLink, getAffiliateDisclaimer, generateCalendarEvent, downloadCalendarFile, createGoogleCalendarUrl } from '../lib/affiliateUtils';
import { Calendar, Users, MessageSquare, Share2, ArrowLeft, Clock, MapPin, Gift, ExternalLink, MessageCircle, Trash2, QrCode, Edit, Coffee, ShoppingBag, CalendarPlus, Wallet, CheckCircle } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [showPurchaseMessage, setShowPurchaseMessage] = useState(false);

  const isCreator = user && event ? user.id === event.creator_id : false;

  const loadEventData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) return;

      setEvent({
        ...eventData,
        budget_goal: Number(eventData.budget_goal) || 0,
        current_amount: Number(eventData.current_amount) || 0,
      });

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

  // FIX REALTIME: Unico listener pulito
  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`event-updates-${event.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Event;
            setEvent(prev => prev ? {
              ...prev,
              current_amount: Number(updated.current_amount),
              budget_goal: Number(updated.budget_goal)
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` },
        () => {
          loadEventData(false); // Ricarica liste e totali senza mostrare il caricamento
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.id]);

  // Barra di avanzamento fluida
  useEffect(() => {
    if (event) {
      const goal = Number(event.budget_goal) || 0;
      const current = Number(event.current_amount) || 0;
      const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
      setProgressWidth(percentage);
    }
  }, [event?.current_amount, event?.budget_goal]);

  // --- GLI ALTRI METODI (handleShare, handleWhatsAppShare, ecc.) rimangono quelli originali ---
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
      alert('Link copied!');
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    const eventUrl = window.location.href;
    const title = `Festa di ${event.celebrant_name}`;
    const description = `${event.description}\n\nPartecipa: ${eventUrl}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(createGoogleCalendarUrl(title, event.event_date, description, eventUrl), '_blank');
    } else {
      downloadCalendarFile(`festa-${event.celebrant_name}.ics`, generateCalendarEvent(title, event.event_date, description, eventUrl));
    }
  };

  const handleConfirmCashPayment = async (contributionId: string) => {
    try {
      const { error } = await supabase.from('contributions').update({ payment_status: 'confirmed' }).eq('id', contributionId);
      if (error) throw error;
      loadEventData(false);
    } catch (error) {
      alert('Errore conferma pagamento');
    }
  };

  const handleWhatsAppShare = () => {
    if (!event) return;
    const message = t('event.whatsappMessage').replace('{name}', event.celebrant_name).replace('{url}', window.location.href);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteEvent = async () => {
    if (!event || !user || !window.confirm(t('dashboard.confirmDelete'))) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
      if (onBack) onBack();
    } catch (error) {
      alert('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center p-4">Event not found</div>;

  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;
  const progressPercentage = budgetGoal > 0 ? Math.min((currentAmount / budgetGoal) * 100, 100) : 0;
  const giftImage = event.gift_url ? extractImageFromUrl(event.gift_url) : null;
  const celebrantImage = event.celebrant_image;
  const ogImage = celebrantImage || giftImage || 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <>
      <Helmet>
        <title>{`Party for ${event.celebrant_name}`}</title>
        <meta property="og:image" content={ogImage} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto pt-8 pb-12">
          {/* Header UI */}
          <div className="mb-6 flex justify-between items-center">
            {onBack && <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /> {t('event.backButton')}</button>}
            {isCreator && (
              <div className="flex gap-2">
                {onEdit && <button onClick={() => onEdit(event.id)} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg"><Edit className="w-5 h-5" /> {t('dashboard.editEvent')}</button>}
                <button onClick={handleDeleteEvent} disabled={deleting} className="bg-red-500 text-white px-4 py-2 rounded-lg">{deleting ? t('dashboard.deleting') : t('event.deleteEvent')}</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Banner & Progress Bar */}
            <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {celebrantImage ? (
                      <img src={celebrantImage} className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center"><Gift className="w-12 h-12 text-white" /></div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{event.celebrant_name}</h1>
                    <div className="flex flex-wrap gap-4 text-white/90">
                       <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</span>
                       {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-3 rounded-full hover:bg-white/30"><QrCode className="w-5 h-5" /></button>
                  <button onClick={handleShare} className="bg-white/20 p-3 rounded-full hover:bg-white/30"><Share2 className="w-5 h-5" /></button>
                </div>
              </div>

              {/* BARRA DEL BUDGET */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t('event.progress')}</span>
                  <span className="text-lg font-bold">{formatCurrency(currentAmount, event.currency)} / {formatCurrency(budgetGoal, event.currency)}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <div className="text-right text-sm mt-1 text-white/80">{progressPercentage.toFixed(1)}% {t('event.reached')}</div>
              </div>
            </div>

            {/* Pulsanti Azione */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <button onClick={() => setShowContributeForm(true)} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                  {t('event.contribute')}
                </button>
                <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                  {t('event.leaveWish')}
                </button>
              </div>

              {/* Liste Contributi e Auguri */}
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold mb-4"><Users className="text-orange-500" /> {t('event.contributions')} ({contributions.length})</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {contributions.map(c => (
                      <div key={c.id} className="bg-gray-50 p-3 rounded-lg flex justify-between">
                        <div>
                          <div className="font-bold">{c.contributor_name}</div>
                          <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-orange-600 font-bold">{formatCurrency(Number(c.base_amount), event.currency)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold mb-4"><MessageSquare className="text-pink-500" /> {t('event.wishes')} ({wishes.length})</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {wishes.map(w => (
                      <div key={w.id} className="bg-pink-50 p-3 rounded-lg">
                        <div className="font-bold text-sm">{w.author_name}</div>
                        <p className="text-sm italic text-gray-700">"{w.message}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modali */}
        {showContributeForm && <ContributionForm eventId={event.id} currency={event.currency} budgetGoal={event.budget_goal} paypalEmail={event.paypal_email} onClose={() => setShowContributeForm(false)} onSuccess={handleContributionAdded} />}
        {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={handleWishAdded} />}
        {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
        <Footer />
      </div>
    </>
  );
}
