import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Coffee, Gift, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalReachedModalProps {
  celebrantName: string;
  onClose: () => void;
}

export default function GoalReachedModal({ celebrantName, onClose }: GoalReachedModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-[scale-up_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('goalReached.title')}
          </h2>

          <p className="text-xl text-gray-700 mb-4">
            {t('goalReached.message').replace('{name}', celebrantName)}
          </p>

          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
            <Gift className="w-5 h-5" />
            <span>{t('goalReached.celebration')}</span>
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Coffee className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                {t('goalReached.supportTitle')}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {t('goalReached.supportMessage')}
              </p>
            </div>
          </div>

          <a
            href="https://buymeacoffee.com/partypool"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 transition shadow-lg hover:shadow-xl text-center"
          >
            {t('goalReached.supportButton')}
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-700 font-medium transition"
        >
          {t('goalReached.maybeLater')}
        </button>
      </div>
    </div>
  );
}
