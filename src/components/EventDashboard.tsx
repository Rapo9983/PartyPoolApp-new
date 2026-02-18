import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, Event, Contribution, Wish } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { addAmazonAffiliateTag, isAmazonLink, generateCalendarEvent, downloadCalendarFile, createGoogleCalendarUrl } from '../lib/affiliateUtils';
import { Calendar, Users, MessageSquare, Share2, ArrowLeft, MapPin, Gift, ExternalLink, MessageCircle, Trash2, QrCode, Edit, Coffee, ShoppingBag, CalendarPlus, Wallet, CheckCircle } from 'lucide-react';
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
  const [event, setEvent] = useState<any | null>(null);
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        (payload) => {
          if (payload.new) {
            setEvent((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${event.id}` },
        () => loadContributionsAndWishes(event.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      if (data) setEvent(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContributionsAndWishes = async (eventId: string) => {
    const [cRes, wRes] = await Promise.all([
      supabase.from('contributions').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      supabase.from('wishes').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    ]);
    if (cRes.data) setContributions(cRes.data);
    if (wRes.data) setWishes(wRes.data);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: `Party for ${event?.celebrant_name}`, url }); }
    else { await navigator.clipboard.writeText(url); alert('Link copiato!'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Evento non trovato</div>;

  const currentAmount = Number(event.current_amount) || 0;
  const budgetGoal = Number(event.budget_goal) || 0;
  const progressPercentage = budgetGoal > 0 ? Math.min((currentAmount / budgetGoal) * 100, 100) : 0;
  const totalCaffé = contributions.reduce((acc, c) => acc + (Number(c.support_amount) || 0), 0);
  const realTotal = contributions.reduce((acc, c) => acc + (Number(c.base_amount) || 0) + (Number(c.support_amount) || 0), 0);

  return (
    <>
      <Helmet><title>{event.celebrant_name} - PartyPool</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4 font-sans">
        <div className="max-w-4xl mx-auto pt-8 pb-12">
          
          <div className="mb-6 flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <ArrowLeft className="w-5 h-5" /> Torna indietro
            </button>
            {isCreator && (
              <button onClick={() => onEdit?.(event.id)} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition shadow-sm">
                <Edit className="w-4 h-4" /> Modifica Evento
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">
            <div className="bg-gradient-to-br from-orange-400 via-pink-400 to-yellow-400 p-8 text-white">
              
              <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-md border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                    {event.celebrant_image ? <img src={event.celebrant_image} className="w-full h-full object-cover" /> : <Gift className="w-12 h-12" />}
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">{event.celebrant_name}</h1>
                    <div className="flex items-center gap-3 mt-2 opacity-90 text-sm md:text-base">
                      <Calendar size={18}/> {new Date(event.event_date).toLocaleDateString()}
                      {event.location && <><span className="opacity-50">|</span> <MapPin size={18}/> {event.location}</>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowQRCode(true)} className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition backdrop-blur-sm"><QrCode size={22}/></button>
                  <button onClick={handleShare} className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition backdrop-blur-sm"><Share2 size={22}/></button>
                </div>
              </div>

              <p className="mb-8 text-lg md:text-xl font-medium leading-relaxed bg-black/5 p-4 rounded-2xl">{event.description}</p>

              {/* SEZIONE REGALO: MOSTRA DESCRIZIONE E LINK */}
              {(event.gift_url || event.gift_description) && (
                <div className="mb-8 bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <ShoppingBag className="text-white" size={24} />
                    <h3 className="font-bold text-xl uppercase tracking-wider text-white">
                      {language === 'it' ? 'Il Regalo' : 'The Gift'}
                    </h3>
                  </div>
                  
                  {event.gift_description && (
                    <p className="text-white font-semibold text-lg mb-4 leading-snug">
                      {event.gift_description}
                    </p>
                  )}

                  {event.gift_url && (
                    <a 
                      href={isAmazonLink(event.gift_url) ? addAmazonAffiliateTag(event.gift_url) : event.gift_url}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-md"
                    >
                      {language === 'it' ? 'Apri link regalo' : 'Open gift link'} <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              )}

              <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="flex justify-between items-center mb-3 font-bold text-sm tracking-widest uppercase">
                  <span>Obiettivo Regalo</span>
                  <span>{formatCurrency(currentAmount, event.currency)} / {formatCurrency(budgetGoal, event.currency)}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner border border-white/10">
                  <div className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ width: `${progressWidth}%` }} />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{progressPercentage.toFixed(0)}% Raggiunto</div>
                  {totalCaffé > 0 && (
                    <div className="flex items-center gap-2 bg-white text-orange-600 px-4 py-1.5 rounded-full text-sm font-black animate-bounce shadow-lg">
                      <Coffee size={16} /> {totalCaffé} {totalCaffé === 1 ? 'Caffè offerto' : 'Caffè offerti'}
                    </div>
                  )}
                </div>
              </div>

              {isCreator && (
                <div className="mt-6 p-4 bg-black/20 rounded-2xl flex items-center justify-between border border-white/10">
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight"><Wallet size={20}/> Incasso Reale (Regali + Caffè):</span>
                  <span className="font-black text-2xl">{formatCurrency(realTotal, event.currency)}</span>
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-10">
                <button onClick={() => setShowContributeForm(true)} className="bg-orange-500 text-white py-5 rounded-2xl font-black hover:bg-orange-600 transition shadow-xl text-xl tracking-tight uppercase">Partecipa al Regalo</button>
                <button onClick={() => setShowWishForm(true)} className="bg-pink-500 text-white py-5 rounded-2xl font-black hover:bg-pink-600 transition flex items-center justify-center gap-3 shadow-xl text-xl tracking-tight uppercase"><MessageSquare size={24}/> Fai gli Auguri</button>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="flex items-center gap-3 font-black text-gray-800 mb-6 text-xl border-b-2 border-orange-100 pb-3 uppercase tracking-tighter">
                    <Users size={24} className="text-orange-500"/> Team Regalo ({contributions.length})
                  </h3>
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3">
                    {contributions.map((c) => (
                      <div key={c.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 font-black text-gray-800 text-lg">
                            {c.contributor_name}
                            {Number(c.support_amount) > 0 && <div className="bg-orange-100 p-1.5 rounded-full"><Coffee size={14} className="text-orange-600"/></div>}
                          </div>
                          <span className="text-orange-600 font-black text-xl">{formatCurrency(Number(c.base_amount), event.currency)}</span>
                        </div>
                        {c.message && <p className="text-sm text-gray-500 mt-3 font-medium bg-white p-3 rounded-xl border border-gray-100 italic">"{c.message}"</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-3 font-black text-gray-800 mb-6 text-xl border-b-2 border-pink-100 pb-3 uppercase tracking-tighter">
                    <MessageSquare size={24} className="text-pink-500"/> Bacheca Auguri
                  </h3>
                  <div className="space-y-4 max-h-[450px] overflow-y-auto">
                    {wishes.map((w) => (
                      <div key={w.id} className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 border border-pink-100 shadow-sm relative overflow-hidden">
                        <div className="font-black text-pink-600 mb-2 text-lg uppercase tracking-tight">{w.author_name}</div>
                        <p className="text-gray-700 leading-relaxed font-medium">{w.message}</p>
                        <div className="absolute top-0 right-0 p-2 opacity-10"><MessageSquare size={40}/></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer onCreateEventClick={() => {}} />
      </div>

      {showContributeForm && <ContributionForm eventId={event.id} currency={event.currency} budgetGoal={event.budget_goal} paypalEmail={event.paypal_email} satispayId={event.satispay_id} organizerName={event.celebrant_name} eventDate={event.event_date} onClose={() => setShowContributeForm(false)} onSuccess={() => {}} />}
      {showWishForm && <WishForm eventId={event.id} onClose={() => setShowWishForm(false)} onSuccess={() => {}} />}
      {showQRCode && <QRCodeModal url={window.location.href} celebrantName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
    </>
  );
}
