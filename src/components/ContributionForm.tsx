import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createPayPalLink, formatCurrency, roundCurrency } from '../lib/utils';
import { requestNotificationPermission, scheduleReminder } from '../lib/affiliateUtils';
import SatispayPopup from './SatispayPopup';
import confetti from 'canvas-confetti';
import { X, User, MessageSquare, Coffee, Wallet, CreditCard, Bell, Calendar as CalendarIcon } from 'lucide-react';

interface ContributionFormProps {
  eventId: string;
  currency: string;
  contributionType: 'free' | 'equal_shares';
  budgetGoal: number;
  participantsCount?: number | null;
  paypalEmail?: string | null;
  satispayId?: string | null;
  organizerName?: string;
  eventDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({ eventId, currency, contributionType, budgetGoal, participantsCount, paypalEmail, satispayId, organizerName, eventDate, onClose, onSuccess }: ContributionFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  const suggestedAmount = contributionType === 'equal_shares' && participantsCount && participantsCount > 0
    ? (budgetGoal / participantsCount).toFixed(2)
    : '';

  const [formData, setFormData] = useState({
    contributorName: '',
    amount: suggestedAmount,
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash',
  });

  const getTotalAmount = () => {
    const base = parseFloat(formData.amount) || 0;
    const support = formData.addSupport ? 1 : 0;
    return roundCurrency(base + support);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Protezione contro i doppi click
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const displayName = formData.isAnonymous
        ? (t('contribution.anonymousHelp').includes('amico') ? 'Un amico' : 'A friend')
        : formData.contributorName;

      const baseAmount = roundCurrency(parseFloat(formData.amount));

      if (isNaN(baseAmount) || baseAmount <= 0) {
        throw new Error('Invalid amount');
      }

      const supportAmount = formData.addSupport ? 1 : 0;
      const totalAmount = roundCurrency(baseAmount + supportAmount);

      // Eseguiamo SOLO l'inserimento. 
      // Il database aggiornerà il totale automaticamente tramite Trigger.
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

      // Effetto successo
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ec4899', '#eab308'],
      });

      // Piccolo delay per far vedere i coriandoli prima di chiudere
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-2 sm:my-8 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('contribution.title')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label htmlFor="contributorName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              {t('contribution.yourName')}
            </label>
            <input
              id="contributorName"
              type="text"
              value={formData.contributorName}
              onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
              required={!formData.isAnonymous}
              disabled={formData.isAnonymous}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition disabled:bg-gray-100"
              placeholder="John Doe"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="text-sm text-gray-700 cursor-pointer">
                {t('contribution.anonymous')}
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2 block">
              {t('contribution.amount')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{currency}</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
              />
            </div>
            
            <div className="mt-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-start gap-2">
                <input
                  id="addSupport"
                  type="checkbox"
                  checked={formData.addSupport}
                  onChange={(e) => setFormData({ ...formData, addSupport: e.target.checked })}
                  className="w-4 h-4 text-orange-500 mt-0.5"
                />
                <label htmlFor="addSupport" className="text-sm cursor-pointer flex-1">
                  <div className="flex items-center gap-1 font-medium text-gray-900 mb-1">
                    <Coffee className="w-4 h-4 text-orange-500" />
                    <span>{t('contribution.addSupport')}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {t('contribution.addSupportDesc')}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              {t('contribution.message')}
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
            />
          </div>

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-center">{t('contribution.paymentMethod')}</h3>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${formData.paymentMethod === 'digital' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="paymentMethod" value="digital" checked={formData.paymentMethod === 'digital'} onChange={(e) => setFormData({ ...formData, paymentMethod: 'digital' })} className="hidden" />
                <CreditCard className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium">{t('contribution.digitalPayment')}</div>
                  <p className="text-xs text-gray-500">{t('contribution.digitalPaymentDesc')}</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${formData.paymentMethod === 'cash' ? 'border-gray-500 bg-gray-50' : 'border-gray-200'}`}>
                <input type="radio" name="paymentMethod" value="cash" checked={formData.paymentMethod === 'cash'} onChange={(e) => setFormData({ ...formData, paymentMethod: 'cash' })} className="hidden" />
                <Wallet className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <div className="font-medium">{t('contribution.cashPayment')}</div>
                  <p className="text-xs text-gray-500">{t('contribution.cashPaymentDesc').replace('{organizer}', organizerName || 'organizzatore')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* PayPal/Satispay Links */}
          {formData.paymentMethod === 'digital' && (paypalEmail || satispayId) && formData.amount && parseFloat(formData.amount) > 0 && (
            <div className="space-y-3 mt-4">
              {paypalEmail && (
                <a
                  href={createPayPalLink(paypalEmail, getTotalAmount(), currency)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#0070ba] text-white py-3 rounded-lg font-semibold text-center"
                >
                  Paga con PayPal - {formatCurrency(getTotalAmount(), currency)}
                </a>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !formData.amount}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
            >
              {loading ? t('contribution.processing') : t('contribution.submit')}
            </button>
          </div>
        </form>
      </div>

      {showSatispayPopup && satispayId && (
        <SatispayPopup
          satispayId={satispayId}
          amount={getTotalAmount().toString()}
          currency={currency}
          onClose={() => setShowSatispayPopup(false)}
        />
      )}
    </div>
  );
}
