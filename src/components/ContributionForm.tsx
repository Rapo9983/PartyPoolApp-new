import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { createPayPalLink, formatCurrency } from '../lib/utils';
import SatispayPopup from './SatispayPopup';
import confetti from 'canvas-confetti';
import { X, User, MessageSquare, Coffee, Wallet, CreditCard } from 'lucide-react';

interface ContributionFormProps {
  eventId: string;
  currency: string;
  budgetGoal: number;
  paypalEmail?: string | null;
  satispayId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({ eventId, currency, budgetGoal, paypalEmail, satispayId, onClose, onSuccess }: ContributionFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);
  const [formData, setFormData] = useState({
    contributorName: '',
    amount: '',
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash',
  });

  const roundToTwo = (num: number) => Math.round(num * 100) / 100;

  const getTotalAmount = () => {
    const base = parseFloat(formData.amount) || 0;
    const support = formData.addSupport ? 1 : 0;
    return roundToTwo(base + support);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !formData.amount) return;
    setLoading(true);

    try {
      const baseAmount = roundToTwo(parseFloat(formData.amount));
      const supportAmount = formData.addSupport ? 1 : 0;
      const totalAmount = roundToTwo(baseAmount + supportAmount);
      const displayName = formData.isAnonymous ? 'Un amico' : formData.contributorName;

      const { error: insertError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          contributor_name: displayName,
          amount: totalAmount,
          base_amount: baseAmount,
          support_amount: supportAmount,
          message: formData.message,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'cash' ? 'promised' : 'confirmed',
        });

      if (insertError) throw insertError;

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      // Timeout per i coriandoli e poi uscita sicura
      setTimeout(() => {
        setLoading(false);
        onSuccess(); 
      }, 1500);

    } catch (err) {
      console.error("Errore invio contributo:", err);
      setLoading(false);
      alert("Si è verificato un errore durante il salvataggio.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('contribution.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Nome</label>
            <input type="text" value={formData.contributorName} onChange={(e) => setFormData({...formData, contributorName: e.target.value})} className="w-full px-4 py-2 border rounded-xl" required={!formData.isAnonymous} disabled={formData.isAnonymous} />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Importo ({currency})</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border rounded-xl" required />
          </div>

          <div className="bg-orange-50 p-3 rounded-xl flex items-center gap-2 border border-orange-100">
            <input id="coffee" type="checkbox" checked={formData.addSupport} onChange={(e) => setFormData({ ...formData, addSupport: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="coffee" className="text-xs font-bold text-orange-700 cursor-pointer flex items-center gap-1">
              <Coffee className="w-4 h-4" /> Offri 1€ per il caffè agli organizzatori
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'digital'})} className={`p-3 border-2 rounded-xl flex items-center gap-3 transition ${formData.paymentMethod === 'digital' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
              <CreditCard className={`w-5 h-5 ${formData.paymentMethod === 'digital' ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="text-sm font-bold">Pagamento Online</span>
            </button>
            <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cash'})} className={`p-3 border-2 rounded-xl flex items-center gap-3 transition ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
              <Wallet className={`w-5 h-5 ${formData.paymentMethod === 'cash' ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="text-sm font-bold">In contanti a mano</span>
            </button>
          </div>

          {formData.paymentMethod === 'digital' && formData.amount && (
            <div className="space-y-2 pt-2 animate-in fade-in zoom-in duration-300">
              {paypalEmail && (
                <a href={createPayPalLink(paypalEmail, getTotalAmount(), currency)} target="_blank" rel="noreferrer" className="block w-full bg-[#0070ba] text-white py-3 rounded-xl font-bold text-center hover:opacity-90">
                  PayPal ({formatCurrency(getTotalAmount(), currency)})
                </a>
              )}
              {satispayId && (
                <button type="button" onClick={() => setShowSatispayPopup(true)} className="w-full bg-[#fa3e5a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90">
                  Satispay ({formatCurrency(getTotalAmount(), currency)})
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || !formData.amount} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-black shadow-lg disabled:opacity-50 transition-all">
            {loading ? 'Salvataggio...' : 'Conferma Donazione'}
          </button>
        </form>
      </div>

      {showSatispayPopup && satispayId && (
        <SatispayPopup satispayId={satispayId} amount={getTotalAmount().toString()} currency={currency} onClose={() => setShowSatispayPopup(false)} />
      )}
    </div>
  );
}
