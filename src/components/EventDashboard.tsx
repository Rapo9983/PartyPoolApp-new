import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Event } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { 
  Calendar, MapPin, Clock, Gift, Users, Share2, 
  ExternalLink, ChevronRight, copy, Check, Info,
  Heart, Star, PartyPopper
} from 'lucide-react';

const PayPalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.5 7.9c0 4.4-3.6 8-8 8h-2l-1 5h-3l2-10h4c2.8 0 5-2.2 5-5 0-.6-.1-1.2-.3-1.7 1.4.8 2.3 2.3 2.3 4 0 .2 0 .5-.1.7z" fill="#009cde"/>
    <path d="M17.2 2.2C16.5 1.5 15.5 1 14.4 1H7.9c-.5 0-.9.4-1 .9L4.5 14.3c-.1.3.2.6.5.6h3l1-5h2c4.4 0 8-3.6 8-8 0-.2 0-.5-.1-.7-.5-.7-1.2-1.2-2-1.5z" fill="#012169"/>
  </svg>
);

const SatispayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="#F5333F" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="8" r="2" fill="#F5333F"/>
    <path d="M8 14h8M8 17h8" stroke="#F5333F" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function EventDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [slug]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single();
      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
    </div>
  );

  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl">{t('event.notFound')}</div>;

  const shareAmount = event.contribution_type === 'equal_shares' && event.participants_count
    ? event.budget_goal / event.participants_count
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-24">
      {/* HERO SECTION ORIGINALE */}
      <div className="relative h-[40vh] md:h-[50vh] min-h-[350px] w-full">
        <div className="absolute inset-0">
          <img 
            src={event.celebrant_image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80'} 
            className="w-full h-full object-cover"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#F8F9FD]" />
        </div>

        {/* Floating Badges */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-orange-500" />
            <span className="font-black text-gray-800 uppercase text-xs tracking-tighter">Evento Speciale</span>
          </div>
          <button onClick={handleShare} className="bg-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {/* Celebrant Info */}
        <div className="absolute bottom-10 left-0 right-0 px-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-40 animate-pulse" />
            <img 
              src={event.celebrant_image || `https://ui-avatars.com/api/?name=${event.celebrant_name}&background=random`} 
              className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover"
              alt={event.celebrant_name}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter text-center">
            {event.celebrant_name}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-30">
        {/* INFO CARD PRINCIPALE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-white/60 p-8 space-y-10">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50 flex flex-col items-center justify-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              <div className="text-center">
                <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest leading-none mb-1">{t('event.eventDate')}</p>
                <p className="font-black text-gray-800 text-lg">{new Date(event.event_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="bg-pink-50/50 p-6 rounded-[2rem] border border-pink-100/50 flex flex-col items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-pink-500" />
              <div className="text-center">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest leading-none mb-1">{t('event.eventTime')}</p>
                <p className="font-black text-gray-800 text-lg">{event.event_time || '--:--'}</p>
              </div>
            </div>
          </div>

          {/* Location Full-width */}
          {event.location && (
            <div className="flex items-center gap-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><MapPin className="w-6 h-6 text-blue-400" /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t('event.location')}</p>
                <p className="font-bold text-gray-800">{event.location}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          )}

          {/* Descrizione con virgolette stilizzate */}
          <div className="relative py-4">
            <div className="absolute top-0 left-0 text-6xl text-orange-100 font-serif leading-none italic select-none">“</div>
            <p className="text-center text-xl text-gray-600 font-medium italic relative z-10 px-8 leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* SEZIONE REGALO - RE-INSERITA GRAFICA COMPLESSA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="h-px w-8 bg-orange-200" />
              <Gift className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800">Cosa vogliamo regalare</h2>
              <div className="h-px w-8 bg-orange-200" />
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[3rem] p-1.5 shadow-2xl">
              <div className="bg-white rounded-[2.6rem] p-8 relative overflow-hidden">
                
                {/* Nuova Descrizione Prodotto - MASSIMA EVIDENZA */}
                {event.gift_description && (
                  <div className="bg-orange-50 rounded-[2rem] p-6 mb-8 border border-orange-100 text-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-black uppercase text-orange-400">Top Wish</span>
                    </div>
                    <p className="text-2xl font-black text-gray-800 leading-tight">
                      {event.gift_description}
                    </p>
                  </div>
                )}

                {/* Progress Circle / Budget Info */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Obiettivo Budget</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-gray-900 tracking-tighter">
                        {formatCurrency(event.budget_goal, event.currency)}
                      </span>
                    </div>
                  </div>

                  {shareAmount && (
                    <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] flex flex-col items-center shadow-xl shadow-gray-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quota a testa</span>
                      <span className="text-3xl font-black tracking-tighter">{formatCurrency(shareAmount, event.currency)}</span>
                    </div>
                  )}
                </div>

                {event.gift_url && (
                  <a 
                    href={event.gift_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-8 flex items-center justify-center gap-2 w-full py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 hover:border-orange-200 transition-all text-sm uppercase tracking-widest"
                  >
                    <ExternalLink className="w-4 h-4" /> Vedi prodotto su Amazon
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* METODI DI PAGAMENTO ORIGINALI */}
          <div className="pt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Invia il tuo contributo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.paypal_email && (
                  <a 
                    href={`https://www.paypal.com/paypalme/${event.paypal_email}`}
                    target="_blank"
                    className="flex items-center justify-between p-6 bg-[#0070ba] text-white rounded-[2rem] shadow-lg shadow-blue-100 hover:translate-y-[-2px] transition-all active:scale-95 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl"><PayPalIcon /></div>
                      <span className="font-black text-lg">PayPal</span>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {event.satispay_id && (
                  <a 
                    href={`https://tag.satispay.com/${event.satispay_id}`}
                    target="_blank"
                    className="flex items-center justify-between p-6 bg-[#f5333f] text-white rounded-[2rem] shadow-lg shadow-red-100 hover:translate-y-[-2px] transition-all active:scale-95 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl"><SatispayIcon /></div>
                      <span className="font-black text-lg">Satispay</span>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-gray-400 text-sm font-bold flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>Organizzato con amore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
