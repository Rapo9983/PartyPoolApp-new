import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Copy, Check } from 'lucide-react';

interface SatispayPopupProps {
  satispayId: string;
  amount: string;
  currency: string;
  onClose: () => void;
}

export default function SatispayPopup({ satispayId, amount, currency, onClose }: SatispayPopupProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(satispayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-[#FC5F3A]">
            {t('event.satispayPopupTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            {t('event.satispayPopupDesc')}
          </p>

          <div className="bg-gradient-to-br from-[#FC5F3A]/10 to-[#FC5F3A]/5 border-2 border-[#FC5F3A] rounded-xl p-6 text-center">
            <div className="text-sm text-gray-600 mb-2">
              {t('contribution.amount')}
            </div>
            <div className="text-3xl font-bold text-[#FC5F3A] mb-4">
              {currency}{parseFloat(amount).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Satispay ID
            </div>
            <div className="text-xl font-semibold text-gray-900 break-all">
              {satispayId}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full bg-[#FC5F3A] text-white py-3 rounded-lg font-semibold hover:bg-[#E54E2A] transition flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                {t('event.numberCopied')}
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                {t('event.copyNumber')}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Open the Satispay app on your phone and send {currency}{parseFloat(amount).toFixed(2)} to the number above
          </p>
        </div>
      </div>
    </div>
  );
}
