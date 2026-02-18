import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Event } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Gift, 
  Users, 
  ExternalLink, 
  Share2, 
  Check, 
  Copy,
  Info
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
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .single();
        if (error) throw error;
        setEvent(data);
      } catch (err) {
        console.error('Error loading event:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-400 tracking-widest animate-pulse">{t('common.loading')}...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold">{t('event.notFound')}</div>;

  const shareAmount = event.contribution_type === 'equal_shares' && event.participants_count
    ? event.budget_goal / event.participants_count
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 font-sans pb-20">
      {/* HEADER DINAMICO */}
      <div className="relative h-80 md:h-[450px] bg-gray-900 overflow-hidden">
        {event.celebrant_image ? (
          <img src={event.celebrant_image} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-pink-500 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white text-center">
          <div className="inline-block p-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-4 shadow-2xl">
            <img 
              src={event.celebrant_image || `https://ui-avatars.com/api/?name=${event.celebrant_name}&background=random`} 
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white"
              alt={event.celebrant_name}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-lg">
            {event.celebrant_name}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto -mt-12 px-4 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-10">
          
          {/* GRID INFO */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex flex-col items-center text-center">
              <Calendar className="w-7 h-7 text-orange-500 mb-2" />
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">{t('event.eventDate')}</span>
              <span className="font-bold text-gray-800">{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
            <div className="bg-pink-50 p-5 rounded-3xl border border-pink-100 flex flex-col items-center text-center">
              <Clock className="w-7 h-7 text-pink-500 mb-2" />
              <span className="text-[10px] font-black uppercase text-pink-400 tracking-widest">{t('event.eventTime')}</span>
              <span className="font-bold text-gray-800">{event.event_time || '--:--'}</span>
            </div>
          </div>

          {/* LOCATION */}
          {event.location && (
            <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-3xl mb-10 border border-gray-100">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><MapPin className="w-6 h-6 text-gray-400" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">{t('event.location')}</p>
                <p className="font-bold text-gray-800">{event.location}</p>
              </div>
            </div>
          )}

          {/* DESCRIZIONE EVENTO */}
          <div className="text-center mb-12">
            <p className="text-xl md:text-2xl font-medium text-gray-600 italic leading-relaxed">
              "{event.description}"
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-12" />

          {/* SEZIONE REGALO - IL CUORE DELLA PAGINA */}
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-3">
              <Gift className="w-8 h-8 text-orange-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Il Regalo di Compleanno</h2>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-[3rem] p-1 shadow-2xl shadow-orange-200">
              <div className="bg-white rounded-[2.7rem] p-8 md:p-10 overflow-hidden relative">
                
                {/* Visualizzazione Nuova Descrizione Regalo */}
                {event.gift_description && (
                  <div className="mb-8 text-center bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                    <div className="flex justify-center mb-2"><Info className="w-5 h-5 text-orange-400" /></div>
                    <p className="text-2xl font-black text-gray-800 leading-tight">
                      {event.gift_description}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] mb-2">Obiettivo Raccolta</p>
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 italic">
                      {formatCurrency(event.budget_goal, event.currency)}
                    </p>
                  </div>
                  
                  {shareAmount && (
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Quota suggerita a testa</p>
                      <p className="text-3xl font-black text-gray-800">{formatCurrency(shareAmount, event.currency)}</p>
                    </div>
                  )}
                </div>

                {event.gift_url && (
                  <div className="mt-8 flex justify-center">
                    <a href={event.gift_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95">
                      <ExternalLink className="w-4 h-4" /> Vedi il prodotto online
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAGAMENTI - RIPRISTINATI */}
          <div className="mt-12 space-y-6 text-center">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">Contribuisci con</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.paypal_email && (
                <a 
                  href={`https://www.paypal.com/paypalme/${event.paypal_email}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-5 bg-[#0070ba] text-white rounded-[2rem] font-bold text-lg hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95"
                >
                  <PayPalIcon /> PayPal
                </a>
              )}
              {event.satispay_id && (
                <a 
                  href={`https://tag.satispay.com/${event.satispay_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-5 bg-[#f5333f] text-white rounded-[2rem] font-bold text-lg hover:shadow-xl hover:shadow-red-200 transition-all active:scale-95"
                >
                  <SatispayIcon /> Satispay
                </a>
              )}
            </div>
          </div>

          {/* BOTTONE CONDIVISIONE */}
          <div className="mt-10 flex justify-center">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-8 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-200 transition-all"
            >
              {copied ? <><Check className="w-4 h-4 text-green-500" /> Copiato!</> : <><Share2 className="w-4 h-4" /> Condividi Evento</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
