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

  const isCreator = user && event ? user.id === event.creator_id : false;

  useEffect(() => {
    loadEventData();
  }, [slug]);

  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`event-live-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${event.id}`,
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Event;
            setEvent((prev) => prev ? {
              ...prev,
              current_amount: Number(updated.current_amount),
              budget_goal: Number(updated.budget_goal),
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contributions',
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          loadContributionsAndWishes(event.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.id]);

  useEffect(() => {
    if (event) {
      const current = Number(event.current_amount) || 0;
      const goal = Number(event.budget_goal) || 0;
      const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
      const timer = setTimeout(() => setProgressWidth(percentage), 100);
      return () => clearTimeout(timer);
    }
  }, [event?.current_amount, event?.budget_goal]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) {
        setLoading(false);
        return;
      }

      setEvent({
        ...eventData,
        budget_goal: Number(eventData.budget_goal),
        current_amount: Number(eventData.current_amount),
      });

      await loadContributionsAndWishes(eventData.id);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContributionsAndWishes = async (eventId: string) => {
    const [contributionsRes, wishesRes] = await Promise.all([
      supabase.from('contributions').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      supabase.from('wishes').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    ]);

    if (contributionsRes.data) setContributions(contributionsRes.data);
    if (wishesRes.data) setWishes(wishesRes.data);
  };

  const handleContributionAdded = () => {
    setShowContributeForm(false);
  };

  const handleWishAdded = () => {
    setShowWishForm(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Party for ${event?.celebrant_name}`,
        text: `Join us in celebrating ${event?.celebrant_name}!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiato negli appunti!');
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    const eventUrl = window.location.href;
    const title = `Festa di ${event.celebrant_name}`;
    const description = `${event.description}\n\nPartecipa alla raccolta: ${eventUrl}`;
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
    } catch (error) {
      alert('Errore durante la conferma del pagamento');
    }
  };

  const handleWhatsAppShare = () => {
    if (!event) return;
    const message = t('event.whatsappMessage').replace('{name}', event.celebrant_name).replace('{url}', window.location.href);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteEvent = async () => {
    if (!event || !user) return;
    if (!window.confirm(t('dashboard.confirmDelete'))) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
      if (onBack) onBack();
    } catch (error) {
      alert('Failed to delete event.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center">
      <div className="text-xl text-gray-600">{t('common.loading')}</div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('event.notFound')}</h2>
        <p className="text-gray-600">{t('event.notFoundDesc')}</p>
      </div>
    </div>
  );

  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;
  const progressPercentage = budgetGoal > 0 ? Math.min((currentAmount / budgetGoal) * 100, 100) : 0;
  
  const totalCaffé = contributions.reduce((acc, c) => acc + (Number(c.support_amount) || 0), 0);
  const realTotal = contributions.reduce((acc, c) => acc + (Number(c.base_amount) || 0) + (Number(c.support_amount) || 0), 0);

  const giftImage = event.gift_url ? extractImageFromUrl(event.gift_url) : null;
  const celebrantImage = event.celebrant_image;
  const ogTitle = language === 'it' ? `Partecipa al regalo per ${event.celebrant_name}!` : `Join us celebrating ${event.celebrant_name}!`;
  const ogDescription = language === 'it' ? 'Contribuisci anche tu su PartyPool!' : 'Contribute on PartyPool!';

  return (
    <>
      <Helmet>
        <title>{event.celebrant_name} - PartyPool</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={celebrantImage || giftImage || 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=1200'} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto pt-8 pb-12">
          <div className="mb-6 flex justify-between items-center">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <ArrowLeft className="w-5 h-5" />
                {t('event.backButton')}
              </button>
            )}
            {isCreator && (
              <div className="flex gap-2">
                {onEdit && (
                  <button onClick={() => onEdit(event.id)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition">
                    <Edit className="w-5 h-5" />
                    {t('dashboard.editEvent')}
                  </button>
                )}
                <button onClick={handleDeleteEvent} disabled={deleting} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {deleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {t('event.deleteEvent')}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
              <div className="flex justify-between items-start mb-6 flex-wrap">
                <div className="flex items-start gap-4 md:gap-6 w-full md:w-auto">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                      {celebrantImage ? (
                        <img src={celebrantImage} alt={event.celebrant_name} className="w-full h-full object-cover" />
                      ) : (
                        <Gift className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                      {t('event.celebrantBadge')}
                    </div>
                  </div>
                  <div className="pt-2 flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 break-words">{event.celebrant_name}</h1>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddToCalendar} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"><CalendarPlus className="w-5 h-5" /></button>
                  <button onClick={() => setShowQRCode(true)} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"><QrCode className="w-5 h-5" /></button>
                  <button onClick={handleShare} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"><Share2 className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(event.event_date).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-5 h-5" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <p className="text-white/90 mb-6">{event.description}</p>

              {(event.gift_description || event.gift_url) && (
                <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                      {giftImage ? (
                        <img src={giftImage} alt="Gift" className="w-full h-full object-cover" />
                      ) : (
                        <Gift className="w-10 h-10 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        <ShoppingBag size={18} /> Il regalo
                      </h3>
                      {event.gift_description && (
                        <p className="text-sm mt-1 opacity-90">{event.gift_description}</p>
                      )}
                      {event.gift_url && (
                        <a
                          href={isAmazonLink(event.gift_url) ? addAmazonAffiliateTag(event.gift_url) : event.gift_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline flex items-center gap-1 mt-1 opacity-90 hover:opacity-100"
                        >
                          Vedi il regalo <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                <div className="flex justify-between items-center mt-1">
                  <div className="text-sm text-white/80">
                    {progressPercentage.toFixed(1)}% {t('event.reached')}
                  </div>
                  {totalCaffé > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      <Coffee size={14} />
                      <span>{totalCaffé} {totalCaffé === 1 ? 'Caffè offerto' : 'Caffè offerti'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {isCreator && (
                <div className="mt-4 p-3 bg-black/10 rounded-lg flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wallet size={16} /> Incasso Totale (Regali + Caffè):
                  </div>
                  <div className="font-bold">{formatCurrency(realTotal, event.currency)}</div>
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <button onClick={() => setShowContributeForm(true)} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition shadow-md">
                  {t('event.contribute')}
                </button>
                <button onClick={() => setShowWishForm(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition flex items-center justify-center gap-2 shadow-md">
                  <MessageSquare className="w-5 h-5" /> {t('event.leaveWish')}
                </button>
              </div>

              <button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-semibold hover:bg-[#1EBE57] transition flex items-center justify-center gap-2 mb-8 shadow-sm">
                <MessageCircle className="w-5 h-5" /> {t('event.shareWhatsApp')}
              </button>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
                    <Users className="w-6 h-6 text-orange-500" /> {t('event.contributions')} ({contributions.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {contributions.length === 0 ? (
                      <p className="text-gray-500 text-sm">{t('event.noContributions')}</p>
                    ) : (
                      contributions.map((contribution) => (
                        <div key={contribution.id} className={`rounded-lg p-4 ${contribution.payment_status === 'promised' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{contribution.contributor_name}</span>
                              {Number(contribution.support_amount) > 0 && (
                                <div className="bg-orange-100 p-1 rounded-full shadow-sm" title="Ha offerto un caffè!">
                                  <Coffee size={12} className="text-orange-500" />
                                </div>
                              )}
                            </div>
                            <span className="text-orange-600 font-bold">{formatCurrency(Number(contribution.base_amount), event.currency)}</span>
                          </div>
                          {contribution.message && <p className="text-sm text-gray-600 mt-1">{contribution.message}</p>}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">{new Date(contribution.created_at).toLocaleDateString()}</span>
                            {isCreator && contribution.payment_status === 'promised' && (
                              <button onClick={() => handleConfirmCashPayment(contribution.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Conferma</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
                    <MessageSquare className="w-6 h-6 text-pink-500" /> {t('event.wishes')} ({wishes.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {wishes.length === 0 ? (
                      <p className="text-gray-500 text-sm">{t('event.noWishes')}</p>
                    ) : (
                      wishes.map((wish) => (
                        <div key={wish.id} className="bg-gradient-to-br from-pink-50 to-yellow-50 rounded-lg p-4">
                          <div className="font-semibold text-gray-800 mb-1">{wish.author_name}</div>
                          <p className="text-gray-700 text-sm">{wish.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer onCreateEventClick={() => {}} />
      </div>

      {showContributeForm && (
        <ContributionForm
          eventId={event.id}
          currency={event.currency}
          contributionType={event.contribution_type}
          budgetGoal={event.budget_goal}
          participantsCount={event.participants_count}
          paypalEmail={event.paypal_email}
          satispayId={event.satispay_id}
          organizerName={event.celebrant_name}
          eventDate={event.event_date}
          onClose={() => setShowContributeForm(false)}
          onSuccess={handleContributionAdded}
        />
      )}

      {showWishForm && (
        <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={handleWishAdded} />
      )}

      {showQRCode && (
        <QRCodeModal url={window.location.href} celebrantName={event.celebrant_name} onClose={() => setShowQRCode(false)} />
      )}
    </>
  );
}
