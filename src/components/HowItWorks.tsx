import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Plus, Users, ShoppingBag } from 'lucide-react';

interface HowItWorksProps {
  onBack: () => void;
  onCreateEvent?: () => void;
}

export default function HowItWorks({ onBack, onCreateEvent }: HowItWorksProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('event.backButton')}
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('howItWorks.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition text-center">
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {t('howItWorks.step1Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('howItWorks.step1Description')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition text-center">
            <div className="bg-gradient-to-br from-pink-400 to-pink-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {t('howItWorks.step2Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('howItWorks.step2Description')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition text-center">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {t('howItWorks.step3Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('howItWorks.step3Description')}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">
            {t('howItWorks.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('howItWorks.ctaSubtitle')}
          </p>
          {onCreateEvent ? (
            <button
              onClick={onCreateEvent}
              className="bg-white text-orange-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              {t('howItWorks.ctaButton')}
            </button>
          ) : (
            <a
              href="/"
              className="inline-block bg-white text-orange-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              {t('howItWorks.ctaButton')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
