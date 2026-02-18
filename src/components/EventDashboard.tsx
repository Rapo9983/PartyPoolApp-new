import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Event } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { 
  Calendar, MapPin, Clock, Gift, Users, Share2, 
  ExternalLink, ChevronRight, Check, Info,
  Heart, PartyPopper
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
    loadEvent();
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-400 tracking-widest animate-pulse">{t('common.loading')}...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold">{t('event.notFound')}</div>;

  const shareAmount = event.contribution_type === 'equal_shares' && event.participants_count
    ? event.budget_goal / event.participants_count
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-24">
      {/* HEADER HERO */}
      <div className="relative h-[40vh] min-h-[350px] w-full bg-gray-900 overflow-hidden">
        {event.celebrant_image && (
          <img src={event.celebrant_image} className="w-full h-full object-cover opacity-60" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FD] via-transparent to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-orange-500" />
            <span className="font-black text-gray-800 uppercase text-xs tracking-tighter">Evento Speciale</span>
          </div>
          <button onClick={handleShare} className="bg-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        <div className="absolute bottom-10 left-0 right-0 px-6 flex flex-col items-center">
          <img 
            src={event.celebrant_image || `https://ui-avatars.com/api/?name=${event.celebrant_name}&background=random`} 
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl object-cover mb-4"
            alt={event.celebrant_name}
          />
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter text-center">{event.celebrant_name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-30">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-white/60 p-8 space-y-8">
          
          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 flex flex-col items-center gap-1">
              <Calendar className="w-6 h-6 text-orange-500 mb-1" />
              <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">{t('event.eventDate')}</span>
              <span className="font-black text-gray-800 text-lg">{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
            <div className="bg-pink-50/50 p-6 rounded-[2rem] border border-pink-100 flex flex-col items-center gap-1">
              <Clock className="w-6 h-6 text-pink-500 mb-1" />
              <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">{t('event.eventTime')}</span>
              <span className="font-black text-gray-800 text-lg">{event.event_time || '--:--'}</span>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><MapPin className="w-6 h-6 text-blue-400" /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t('event.location')}</p>
                <p className="font-bold text-gray-800">{event.location}</p>
              </div>
            </div>
          )}

          <p className="text-center text-xl text-gray-600 font-medium italic px-8">"{event.description}"</p>

          <div className="h-px bg-gray-100 w-full" />

          {/* BOX REGALO - SOLO AGGIUNTE MIRATE */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-center">
              <Gift className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800">Cosa vogliamo regalare</h2>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[3rem] p-1 shadow-2xl">
              <div className="bg-white rounded-[2.6rem] p-8">
                
                {/* 1. AGGIUNTA: DESCRIZIONE REGALO */}
                {event.gift_description && (
                  <div className="bg-orange-50/50 rounded-3xl p-6 mb-8 border border-orange-100 text-center">
                    <p className="text-2xl font-black text-gray-800 leading-tight">
                      {event.gift_description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Obiettivo Budget</p>
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">
                      {formatCurrency(event.budget_goal, event.currency)}
                    </span>
                  </div>
                  {shareAmount && (
                    <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quota a testa</span>
                      <span className="text-2xl font-black">{formatCurrency(shareAmount, event.currency)}</span>
                    </div>
                  )}
                </div>

                {/* 2. MODIFICA: ETICHETTA LINK */}
                {event.gift_url && (
                  <a href={event.gift_url} target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center gap-2 w-full py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm uppercase tracking-widest">
                    <ExternalLink className="w-4 h-4" /> Vedi il regalo online
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* PAGAMENTI */}
          <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.paypal_email && (
              <a href={`https://www.paypal.com/paypalme/${event.paypal_email}`} target="_blank" className="flex items-center justify-between p-6 bg-[#0070ba] text-white rounded-[2rem] shadow-lg hover:translate-y-[-2px] transition-all">
                <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-xl"><PayPalIcon /></div><span className="font-black text-lg">PayPal</span></div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </a>
            )}
            {event.satispay_id && (
              <a href={`https://tag.satispay.com/${event.satispay_id}`} target="_blank" className="flex items-center justify-between p-6 bg-[#f5333f] text-white rounded-[2rem] shadow-lg hover:translate-y-[-2px] transition-all">
                <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-xl"><SatispayIcon /></div><span className="font-black text-lg">Satispay</span></div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
