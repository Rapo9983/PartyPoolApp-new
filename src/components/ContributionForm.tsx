import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { createPayPalLink } from '../lib/utils';
import SatispayPopup from './SatispayPopup';
import confetti from 'canvas-confetti';
import { X, Coffee, Wallet, CreditCard, User, MessageSquare, UserPlus } from 'lucide-react';

interface ContributionFormProps {
  eventId: string;
  currency: string;
  budgetGoal: number;
  paypalEmail?: string;
  satispayId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({
  eventId,
  currency,
  paypalEmail,
  satispayId,
  onClose,
  onSuccess
}: ContributionFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !formData.amount) return;

    setLoading(true);

    try {
      const base = parseFloat(formData.amount);
      const support = formData.addSupport ? 1 : 0;
      const finalName = formData.isAnonymous ? 'Un amico' : (formData.name || 'Anonimo');

      // 1. Inserimento del contributo nella tabella 'contributions'
      const { data: contributionData, error: contributionError } = await supabase
        .from('contributions')
        .insert([{
          event_id: eventId,
          contributor_name: finalName,
          amount: base + support,
          base_amount: base,
          support_amount: support,
          message: formData.message,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'cash' ? 'promised' : 'confirmed',
          contributor_user_id: user?.id || null
        }])
        .select()
        .single();

      if (contributionError) {
        console.error("Dettaglio Errore Supabase (Contributions):", contributionError);
        throw new Error(contributionError.message);
      }

      // 2. Inserimento del messaggio d'auguri nella tabella 'wishes'
      if (formData.message.trim()) {
        const { error: wishError } = await supabase
          .from('wishes')
          .insert([{
            event_id: eventId,
            author_name: finalName,
            message: formData.message
          }]);

        if (wishError) {
          console.error("Dettaglio Errore Supabase (Wishes):", wishError);
        }
      }

      // Effetto successo
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ec4899', '#eab308']
      });

      // Se l'utente NON è loggato, mostriamo il prompt di registrazione
      if (!user && contributionData) {
        setContributionId(contributionData.id);
        setShowRegistrationPrompt(true);
        setLoading(false);
      } else {
        // Altrimenti chiudiamo normalmente
        setTimeout(() => {
          setLoading(false);
          onSuccess();
        }, 1500);
      }

    } catch (err: any) {
      setLoading(false);
      console.error("Errore completo durante il salvataggio:", err);
      alert(`Non è stato possibile salvare il regalo: ${err.message || 'Errore di connessione'}`);
    }
  };

  const handleSaveToProfile = async () => {
    window.location.href = `/registrazione?redirect=true&contribution_id=${contributionId}`;
  };

  const handleSkipRegistration = () => {
    setShowRegistrationPrompt(false);
    onSuccess();
  };

  const currentAmountValue = parseFloat(formData.amount) || 0;
  const total = currentAmountValue + (formData.addSupport ? 1 : 0);

  if (showRegistrationPrompt) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] backdrop-blur-md">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
          <div className="p-8 border-b bg-gradient-to-r from-orange-50 via-pink-50 to-yellow-50">
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter text-center">{t('contribution.thankYou')}</h2>
          </div>
          <div className="p-10 space-y-6 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{t('contribution.saveMemory')}</h3>
            <p className="text-gray-600">
              {t('contribution.saveMemoryDesc')}
            </p>
            <div className="space-y-3 pt-4">
              <button
                onClick={handleSaveToProfile}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-5 rounded-[2rem] font-black shadow-xl hover:from-orange-600 hover:to-pink-600 transition-all uppercase tracking-tighter"
              >
                {t('contribution.saveToProfile')}
              </button>
              <button
                onClick={handleSkipRegistration}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-[2rem] font-bold hover:bg-gray-200 transition-all"
              >
                {t('contribution.noThanks')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">

        {/* Header */}
        <div className="p-8 border-b flex justify-between items-center bg-gradient-to-r from-orange-50 via-pink-50 to-yellow-50">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">{t('contribution.makeGift')}</h2>
          <button
            onClick={onClose}
            className="p-3 bg-white shadow-md rounded-full hover:bg-gray-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[80vh]">

          {/* Campo Nome */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contribution.yourName')}</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-bold focus:border-orange-500 outline-none transition-all"
                placeholder={t('contribution.namePlaceholder')}
                required={!formData.isAnonymous}
                disabled={formData.isAnonymous}
              />
            </div>
            <label className="flex items-center gap-3 ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                className="w-5 h-5 rounded-lg text-orange-500 border-gray-200"
              />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('contribution.hideName')}</span>
            </label>
          </div>

          {/* Campo Importo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contribution.howMuch')}</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-orange-500">
                {currency === 'EUR' ? '€' : currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full pl-12 pr-6 py-6 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-black text-3xl focus:border-orange-500 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Campo Messaggio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('contribution.writeMessage')}</label>
            <div className="relative">
              <MessageSquare className="absolute left-5 top-6 text-gray-400" size={20} />
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-bold focus:border-orange-500 outline-none transition-all h-32 resize-none"
                placeholder={t('contribution.messagePlaceholder')}
              />
            </div>
          </div>

          {/* Opzione Sostegno (Caffè) */}
          <div className="bg-orange-50 p-6 rounded-[2rem] border-2 border-orange-100/50">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="bg-white p-3 rounded-xl shadow-sm"><Coffee className="text-orange-500" /></div>
              <div className="flex-1">
                <span className="text-sm font-black text-orange-900 uppercase tracking-tighter block">{t('contribution.offerCoffee')}</span>
                <span className="text-[10px] font-bold text-orange-600/70 uppercase">{t('contribution.supportPlatform')}</span>
              </div>
              <input
                type="checkbox"
                checked={formData.addSupport}
                onChange={(e) => setFormData({...formData, addSupport: e.target.checked})}
                className="w-6 h-6 rounded-lg text-orange-500 border-orange-200"
              />
            </label>
          </div>

          {/* Metodo di Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, paymentMethod: 'digital'})}
              className={`p-6 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'digital' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg' : 'border-gray-100 text-gray-400'}`}
            >
              <CreditCard size={24} />
              <span className="font-black text-[10px] uppercase tracking-widest">{t('contribution.onlinePayment')}</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
              className={`p-6 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg' : 'border-gray-100 text-gray-400'}`}
            >
              <Wallet size={24} />
              <span className="font-black text-[10px] uppercase tracking-widest">{t('contribution.cashInHand')}</span>
            </button>
          </div>

          {/* Pulsanti Rapidi Online */}
          {formData.paymentMethod === 'digital' && total > 0 && (
            <div className="space-y-3 pt-4 animate-in slide-in-from-bottom-4">
              {paypalEmail && (
                <a
                  href={createPayPalLink(paypalEmail, total, currency)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#0070ba] text-white py-5 rounded-[1.5rem] font-black text-center shadow-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs"
                >
                  {t('contribution.payWithPayPal')}
                </a>
              )}
              {satispayId && (
                <button
                  type="button"
                  onClick={() => setShowSatispayPopup(true)}
                  className="w-full bg-[#fa3e5a] text-white py-5 rounded-[1.5rem] font-black shadow-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs"
                >
                  {t('contribution.payWithSatispay')}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-900 transition-all active:scale-95 uppercase tracking-tighter mt-4 disabled:opacity-50"
          >
            {loading ? t('contribution.saving') : t('contribution.confirmGift')}
          </button>
        </form>
      </div>

      {showSatispayPopup && (
        <SatispayPopup 
          satispayId={satispayId} 
          amount={total.toString()} 
          currency={currency} 
          onClose={() => setShowSatispayPopup(false)} 
        />
      )}
    </div>
  );
}
