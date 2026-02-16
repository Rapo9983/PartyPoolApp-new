import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createPayPalLink, formatCurrency } from '../lib/utils';
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
    return base + support;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const displayName = formData.isAnonymous
        ? (t('contribution.anonymousHelp').includes('amico') ? 'Un amico' : 'A friend')
        : formData.contributorName;

      const baseAmount = parseFloat(formData.amount);
      const supportAmount = formData.addSupport ? 1 : 0;
      const totalAmount = baseAmount + supportAmount;

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
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ec4899', '#eab308'],
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('contribution.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="John Doe"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isAnonymous" className="text-sm text-gray-700 cursor-pointer">
                {t('contribution.anonymous')} <span className="text-gray-500">({t('contribution.anonymousHelp')})</span>
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
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="0.00"
              />
            </div>
            <div className="mt-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-start gap-2">
                <input
                  id="addSupport"
                  type="checkbox"
                  checked={formData.addSupport}
                  onChange={(e) => setFormData({ ...formData, addSupport: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                />
                <label htmlFor="addSupport" className="text-sm cursor-pointer flex-1">
                  <div className="flex items-center gap-1 font-medium text-gray-900 mb-1">
                    <Coffee className="w-4 h-4 text-orange-500" />
                    <span>{t('contribution.addSupport')}</span>
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {t('contribution.addSupportDesc')}
                  </div>
                </label>
              </div>
              {formData.addSupport && (
                <div className="mt-2 text-center text-sm font-semibold text-orange-600">
                  {t('contribution.totalAmount')}: {formatCurrency(getTotalAmount(), currency)}
                </div>
              )}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
              placeholder={t('contribution.messagePlaceholder')}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              {t('contribution.paymentMethod') || 'Metodo di pagamento'}
            </label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:border-blue-400 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="digital"
                  checked={formData.paymentMethod === 'digital'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'digital' | 'cash' })}
                  className="w-5 h-5 text-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Pagamento Digitale</span>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Consigliato</span>
                  </div>
                  <p className="text-sm text-gray-600">PayPal, Satispay o bonifico</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'digital' | 'cash' })}
                  className="w-5 h-5 text-gray-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 mb-1">
                    <Wallet className="w-4 h-4 text-gray-600" />
                    <span>Pagamento in Contanti</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pagherò in contanti direttamente a {organizerName || 'l\'organizzatore'}
                  </p>
                </div>
              </label>
            </div>

            {formData.paymentMethod === 'cash' && eventDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 mb-3">
                  La tua quota verrà segnata come "promessa" fino a quando {organizerName || 'l\'organizzatore'} non confermerà di aver ricevuto il pagamento.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const hasPermission = await requestNotificationPermission();
                    if (hasPermission) {
                      const eventDateTime = new Date(eventDate);
                      const reminderDate = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
                      scheduleReminder(
                        'Promemoria PartyPool',
                        `Ricorda di portare ${formatCurrency(getTotalAmount(), currency)} in contanti per il regalo`,
                        reminderDate
                      );
                      setReminderSet(true);
                    } else {
                      alert('Per impostare promemoria, devi abilitare le notifiche nel browser');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition font-medium"
                  disabled={reminderSet}
                >
                  {reminderSet ? (
                    <>
                      <CalendarIcon className="w-4 h-4" />
                      Promemoria impostato
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Ricordami di portare i soldi alla festa
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {formData.paymentMethod === 'digital' && (paypalEmail || satispayId) && formData.amount && parseFloat(formData.amount) > 0 && (
            <div className="space-y-3">
              {paypalEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    {t('event.payWithPayPal')}
                  </p>
                  <a
                    href={createPayPalLink(paypalEmail, getTotalAmount(), currency, organizerName ? `Regalo per ${organizerName}` : undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#0070ba] text-white py-3 rounded-lg font-semibold hover:bg-[#005ea6] transition text-center"
                  >
                    PayPal - {formatCurrency(getTotalAmount(), currency)}
                  </a>
                </div>
              )}

              {satispayId && (
                <div className="bg-[#FC5F3A]/10 border border-[#FC5F3A] rounded-lg p-4">
                  <p className="text-sm text-[#FC5F3A] mb-3">
                    {t('event.payWithSatispay')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSatispayPopup(true)}
                    className="block w-full bg-[#FC5F3A] text-white py-3 rounded-lg font-semibold hover:bg-[#E54E2A] transition text-center"
                  >
                    Satispay - {formatCurrency(getTotalAmount(), currency)}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('contribution.processing') : t('contribution.submit')}
          </button>
        </form>
      </div>

      {showSatispayPopup && satispayId && formData.amount && (
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
