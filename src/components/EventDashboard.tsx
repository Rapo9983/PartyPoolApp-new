import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabaseClient';
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
  const [event, setEvent] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [wishes, setWishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const loadData = async () => {
    try {
      const { data: ev, error: err } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
      if (err || !ev) {
        setLoading(false);
        return;
      }

      const { data: contr } = await supabase.from('contributions').select('*').eq('event_id', ev.id).order('created_at', { ascending: false });
      const { data: wsh } = await supabase.from('wishes').select('*').eq('event_id', ev.id).order('created_at', { ascending: false });

      setEvent(ev);
      setContributions(contr || []);
      setWishes(wsh || []);
    } catch (e) {
      console.error("Errore caricamento:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Evento non trovato</div>;

  // Calcoli sicuri (prevengono il crash se i dati sono nulli)
  const goal = Number(event.budget_goal) || 0;
  const current = Number(event.current_amount) || 0;
  const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const coffeeCount = contributions.reduce((acc, c) => acc + (Number(c.support_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Helmet><title>{event.celebrant_name || 'Evento'}</title></Helmet>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between mb-4">
          <button onClick={onBack} className="text-gray-500 flex items-center gap-1"><ArrowLeft size={18}/> Indietro</button>
          {user?.id === event.creator_id && (
            <button onClick={() => onEdit?.(event.id)} className="text-orange-500 flex items-center gap-1"><Edit size={18}/> Modifica</button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-orange-500 p-6 text-white text-center">
            <h1 className="text-3xl font-bold">{event.celebrant_name}</h1>
            <p className="opacity-80 flex items-center justify-center gap-2 mt-2"><Calendar size={16}/> {event.event_date}</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between font-bold mb-2">
                <span>{formatCurrency(current, event.currency || 'EUR')}</span>
                <span className="text-gray-400">Target: {formatCurrency(goal, event.currency || 'EUR')}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${percent}%` }} />
              </div>
              {coffeeCount > 0 && <p className="text-center text-orange-500 font-bold mt-2">☕ {coffeeCount} caffè offerti!</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => setShowContributeForm(true)} className="bg-orange-500 text-white py-3 rounded-xl font-bold">Regala</button>
              <button onClick={() => setShowWishForm(true)} className="bg-pink-500 text-white py-3 rounded-xl font-bold">Auguri</button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="font-bold border-b pb-2 mb-3">Partecipanti</h3>
                {contributions.map(c => (
                  <div key={c.id} className="flex justify-between text-sm py-1">
                    <span>{c.contributor_name}</span>
                    <span className="font-bold">{formatCurrency(c.base_amount, event.currency || 'EUR')}</span>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      </div>

      {showContributeForm && (
        <ContributionForm 
          eventId={event.id} 
          currency={event.currency || 'EUR'} 
          budgetGoal={goal} 
          paypalEmail={event.paypal_email} 
          satispayId={event.satispay_id} 
          onClose={() => setShowContributeForm(false)} 
          onSuccess={() => { setShowContributeForm(false); loadData(); }} 
        />
      )}
      
      {showWishForm && (
        <WishForm 
          eventId={event.id} 
          onClose={() => setShowWishForm(false)} 
          onSuccess={() => { setShowWishForm(false); loadData(); }} 
        />
      )}
      
      {showQRCode && <QRCodeModal url={window.location.href} eventName={event.celebrant_name} onClose={() => setShowQRCode(false)} />}
      <Footer />
    </div>
  );
}
