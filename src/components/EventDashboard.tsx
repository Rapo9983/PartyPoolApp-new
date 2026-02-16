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

  useEffect(() => {
    loadEventData();
  }, [slug]);

  useEffect(() => {
    if (event) {
      const currentAmount = Number(event.current_amount) || 0;
      const budgetGoal = Number(event.budget_goal) || 0;
      const progressPercentage = budgetGoal > 0
        ? Math.min((currentAmount / budgetGoal) * 100, 100)
        : 0;

      setTimeout(() => {
        setProgressWidth(progressPercentage);
      }, 100);
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

      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });

      if (contributionsData) {
        setContributions(contributionsData);
      }

      const { data: wishesData } = await supabase
        .from('wishes')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });

      if (wishesData) {
        setWishes(wishesData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContributionAdded = () => {
    setShowContributeForm(false);
    loadEventData();
  };

  const handleWishAdded = () => {
    setShowWishForm(false);
    loadEventData();
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
      alert('Link copied to clipboard!');
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    const eventUrl = window.location.href;
    const title = `Festa di ${event.celebrant_name}`;
    const description = `${event.description}\n\nPartecipa alla raccolta: ${eventUrl}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const googleCalUrl = createGoogleCalendarUrl(title, event.event_date, description, eventUrl);
      window.open(googleCalUrl, '_blank');
    } else {
      const icalContent = generateCalendarEvent(title, event.event_date, description, eventUrl);
      downloadCalendarFile(`festa-${event.celebrant_name}.ics`, icalContent);
    }
  };

  const handleConfirmCashPayment = async (contributionId: string) => {
    try {
      const { error } = await supabase
        .from('contributions')
        .update({ payment_status: 'confirmed' })
        .eq('id', contributionId);

      if (error) throw error;

      loadEventData();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Errore durante la conferma del pagamento');
    }
  };

  const handleWhatsAppShare = () => {
    if (!event) return;
    const url = window.location.href;
    const message = t('event.whatsappMessage')
      .replace('{name}', event.celebrant_name)
      .replace('{url}', url);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDeleteEvent = async () => {
    if (!event || !user) return;

    if (!window.confirm(t('dashboard.confirmDelete'))) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('event.notFound')}</h2>
          <p className="text-gray-600">{t('event.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;
  const progressPercentage = budgetGoal > 0 ? Math.min((currentAmount / budgetGoal) * 100, 100) : 0;
  const eventUrl = window.location.href;
  const giftImage = event.gift_url ? extractImageFromUrl(event.gift_url) : null;
  const celebrantImage = event.celebrant_image;
  const ogTitle = language === 'it'
    ? `Partecipa al regalo per ${event.celebrant_name}!`
    : `Join us celebrating ${event.celebrant_name}!`;
  const ogDescription = language === 'it'
    ? 'Contribuisci anche tu su PartyPool!'
    : 'Contribute on PartyPool!';
  const ogImage = celebrantImage || giftImage || 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <>
      <Helmet>
        <meta name="description" content={ogDescription} />

        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={eventUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto pt-8 pb-12">
        <div className="mb-6 flex justify-between items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('event.backButton')}
            </button>
          )}
          {user && event.creator_id === user.id && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(event.id)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                >
                  <Edit className="w-5 h-5" />
                  {t('dashboard.editEvent')}
                </button>
              )}
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('dashboard.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    {t('event.deleteEvent')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  {celebrantImage ? (
                    <img
                      src={celebrantImage}
                      alt={event.celebrant_name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-xl flex items-center justify-center ${celebrantImage ? 'hidden' : ''}`}>
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                    {t('event.celebrantBadge')}
                  </div>
                </div>
                <div className="pt-2">
                  <h1 className="text-4xl font-bold mb-1">{event.celebrant_name}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCalendar}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"
                  title="Aggiungi al Calendario"
                >
                  <CalendarPlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowQRCode(true)}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"
                  title={t('event.showQR')}
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-5 h-5" />
                <span>{new Date(event.event_date).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                {event.event_time && (
                  <>
                    <Clock className="w-5 h-5 ml-4" />
                    <span>{event.event_time}</span>
                  </>
                )}
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-5 h-5" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            <p className="text-white/90 mb-6">{event.description}</p>

            {event.gift_url && (
              <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5" />
                  <span className="font-medium">{t('event.giftPreview')}</span>
                </div>
                <div className="flex gap-4 items-center">
                  {extractImageFromUrl(event.gift_url) && (
                    <img
                      src={extractImageFromUrl(event.gift_url) || ''}
                      alt="Gift"
                      className="w-32 h-32 object-contain bg-white rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <a
                    href={addAmazonAffiliateTag(event.gift_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('event.viewGift')}
                  </a>
                </div>
              </div>
            )}

            {currentAmount >= budgetGoal && isCreator ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Gift className="w-6 h-6 text-white animate-bounce" />
                    <span className="text-xl font-bold text-white">{t('goalReached.badge')}</span>
                    <Gift className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div className="text-center text-white/90 text-sm font-medium">
                    {formatCurrency(currentAmount, event.currency)} / {formatCurrency(budgetGoal, event.currency)}
                  </div>
                </div>

                {event.gift_url && (
                  <div className="space-y-2">
                    <a
                      href={addAmazonAffiliateTag(event.gift_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setShowPurchaseMessage(true);
                        setTimeout(() => setShowPurchaseMessage(false), 3000);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-3 shadow-lg transform hover:scale-105"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      Obiettivo raggiunto! Acquista il regalo
                    </a>
                    {showPurchaseMessage && (
                      <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg text-sm text-center animate-pulse">
                        Ti stiamo indirizzando su Amazon per completare l'acquisto...
                      </div>
                    )}
                    {isAmazonLink(event.gift_url) && (
                      <p className="text-xs text-white/70 text-center px-4">
                        {getAffiliateDisclaimer()}
                      </p>
                    )}
                  </div>
                )}

                <a
                  href="https://buymeacoffee.com/partypool"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 rounded-xl p-4 block transition flex items-center justify-center gap-2"
                >
                  <Coffee className="w-5 h-5 text-white" />
                  <span className="text-sm font-medium text-white">
                    Sostieni il progetto PartyPool
                  </span>
                </a>
              </div>
            ) : (
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
                <div className="text-right text-sm mt-1 text-white/80">
                  {progressPercentage.toFixed(1)}% {t('event.reached')}
                </div>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => setShowContributeForm(true)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
              >
                {t('event.contribute')}
              </button>

              <button
                onClick={() => setShowWishForm(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {t('event.leaveWish')}
              </button>
            </div>

            <button
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] text-white py-4 rounded-xl font-semibold hover:bg-[#1EBE57] transition flex items-center justify-center gap-2 mb-8"
            >
              <MessageCircle className="w-5 h-5" />
              {t('event.shareWhatsApp')}
            </button>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
                  <Users className="w-6 h-6 text-orange-500" />
                  {t('event.contributions')} ({contributions.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {contributions.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('event.noContributions')}</p>
                  ) : (
                    contributions.map((contribution) => (
                      <div key={contribution.id} className={`rounded-lg p-4 ${contribution.payment_status === 'promised' ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800">{contribution.contributor_name}</span>
                            {contribution.support_amount > 0 && isCreator && (
                              <Coffee className="w-4 h-4 text-orange-500" title={t('piggybank.supporterBadge')} />
                            )}
                            {contribution.payment_method === 'cash' && (
                              <span className="flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                <Wallet className="w-3 h-3" />
                                Contanti
                              </span>
                            )}
                            {contribution.payment_status === 'promised' && (
                              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                Promesso
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-orange-600 font-bold">{formatCurrency(Number(contribution.base_amount), event.currency)}</span>
                            {contribution.support_amount > 0 && isCreator && (
                              <div className="text-xs text-orange-500">+{formatCurrency(Number(contribution.support_amount), event.currency)} ☕</div>
                            )}
                          </div>
                        </div>
                        {contribution.message && (
                          <p className="text-sm text-gray-600 mb-2">{contribution.message}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">
                            {new Date(contribution.created_at).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US')}
                          </span>
                          {isCreator && contribution.payment_status === 'promised' && (
                            <button
                              onClick={() => handleConfirmCashPayment(contribution.id)}
                              className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition font-medium"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Conferma Ricezione
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isCreator && (() => {
                  const totalSupport = contributions.reduce((sum, c) => sum + Number(c.support_amount), 0);

                  if (totalSupport > 0) {
                    return (
                      <div className="mt-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 border-2 border-orange-200">
                        <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                          <Coffee className="w-5 h-5 text-orange-500" />
                          {t('piggybank.title')}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {t('piggybank.description')}
                        </p>
                        <div className="bg-white rounded-lg p-4 mb-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">{t('piggybank.totalCollected')}</div>
                          <div className="text-3xl font-bold text-orange-600">
                            {formatCurrency(totalSupport, event.currency)}
                          </div>
                        </div>
                        {!event.is_supporter ? (
                          <a
                            href="https://buymeacoffee.com/partypool"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setTimeout(async () => {
                                await supabase
                                  .from('events')
                                  .update({ is_supporter: true })
                                  .eq('id', event.id);
                                window.location.reload();
                              }, 1000);
                            }}
                            className="block w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 transition shadow-lg hover:shadow-xl text-center"
                          >
                            {t('piggybank.sendSupport')}
                          </a>
                        ) : (
                          <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                              <Gift className="w-5 h-5" />
                              <span>{t('piggybank.supporterBadge')}</span>
                              <Gift className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-green-600 mt-2">{t('piggybank.thankYou')}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
                  <MessageSquare className="w-6 h-6 text-pink-500" />
                  {t('event.wishes')} ({wishes.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {wishes.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('event.noWishes')}</p>
                  ) : (
                    wishes.map((wish) => (
                      <div key={wish.id} className="bg-gradient-to-br from-pink-50 to-yellow-50 rounded-lg p-4">
                        <div className="font-semibold text-gray-800 mb-1">{wish.author_name}</div>
                        <p className="text-gray-700 text-sm mb-2">{wish.message}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(wish.created_at).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
        <WishForm
          eventId={event.id}
          onClose={() => setShowWishForm(false)}
          onSuccess={handleWishAdded}
        />
      )}

      {showQRCode && (
        <QRCodeModal
          url={eventUrl}
          eventName={event.celebrant_name}
          onClose={() => setShowQRCode(false)}
        />
      )}

      <Footer />
      </div>
    </>
  );
}
