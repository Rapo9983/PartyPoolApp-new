import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
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
  organizerName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({ eventId, currency, budgetGoal, paypalEmail, satispayId, organizerName, onClose, onSuccess }: ContributionFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);

  const [formData, setFormData] = useState({
    contributorName: '',
    amount: '',
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash',
  });

  // Funzione helper per arrotondare correttamente al centesimo
  const roundToTwo = (num: number) => Math.round(num * 100) / 100;

  const getTotalAmount = () => {
    const base = parseFloat(formData.amount) || 0;
    const support = formData.addSupport ? 1 : 0;
    return roundToTwo(base + support);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const rawBaseAmount = parseFloat(formData.amount);
      if (isNaN(rawBaseAmount) || rawBaseAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // ARROTONDAMENTO FORZATO prima dell'invio
      const baseAmount = roundToTwo(rawBaseAmount);
      const supportAmount = formData.addSupport ? 1 : 0;
      const totalAmount = roundToTwo(baseAmount + supportAmount);

      const displayName = formData.isAnonymous
        ? (t('contribution.anonymousHelp').includes('amico') ? 'Un amico' : 'A friend')
        : formData.contributorName;

      const { error: insertError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          contributor_id: user?.id || null,
          contributor_name: displayName,
          amount: totalAmount,
          base_amount: baseAmount,
          support_amount: supportAmount,
          message: formData.message,
          is_anonymous: formData.isAnonymous,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'cash' ? 'promised' : 'confirmed',
        });

      if (insertError) throw insertError;

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('contribution.title')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" /> {t('contribution.yourName')}
            </label>
            <input
              type="text"
              value={formData.contributorName}
              onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
              required={!formData.isAnonymous}
              disabled={formData.isAnonymous}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                id="isAnon"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 text-orange-500"
              />
              <label htmlFor="isAnon" className="text-sm text-gray-600">{t('contribution.anonymous')}</label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('contribution.amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{currency}</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            
            <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="flex items-start gap-2">
                <input
                  id="coffee"
                  type="checkbox"
                  checked={formData.addSupport}
                  onChange={(e) => setFormData({ ...formData, addSupport: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="coffee" className="text-sm cursor-pointer">
                  <div className="font-bold flex items-center gap-1 text-orange-700">
                    <Coffee className="w-4 h-4" /> {t('contribution.addSupport')}
                  </div>
                  <p className="text-xs text-orange-600">{t('contribution.addSupportDesc')}</p>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" /> {t('contribution.message')}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${formData.paymentMethod === 'digital' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
              <input type="radio" className="hidden" checked={formData.paymentMethod === 'digital'} onChange={() => setFormData({...formData, paymentMethod: 'digital'})} />
              <CreditCard className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold">{t('contribution.digitalPayment')}</span>
            </label>
            <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
              <input type="radio" className="hidden" checked={formData.paymentMethod === 'cash'} onChange={() => setFormData({...formData, paymentMethod: 'cash'})} />
              <Wallet className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold">{t('contribution.cashPayment')}</span>
            </label>
          </div>

          {formData.paymentMethod === 'digital' && paypalEmail && formData.amount && (
            <a
              href={createPayPalLink(paypalEmail, getTotalAmount(), currency)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#0070ba] text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition"
            >
              Paga con PayPal ({formatCurrency(getTotalAmount(), currency)})
            </a>
          )}

          <button
            type="submit"
            disabled={loading || !formData.amount}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
          >
            {loading ? t('contribution.processing') : t('contribution.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
