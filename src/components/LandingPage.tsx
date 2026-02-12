import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Share2, Plus, Sparkles, HelpCircle } from 'lucide-react';
import Footer from './Footer';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useLanguage();

  const navigateToFAQ = () => {
    window.history.pushState({}, '', '/faq');
    window.location.href = '/faq';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-6">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">{t('landing.badge')}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('landing.heroTitle')}
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>

          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('landing.cta')}
          </button>
        </div>

        <div id="how-it-works-section" className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {t('landing.howItWorksTitle')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('landing.step1Title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.step1Description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-pink-400 to-yellow-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('landing.step2Title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.step2Description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('landing.step3Title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.step3Description')}
              </p>
            </div>
          </div>
        </div>

        <div id="faq-section" className="mb-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl p-12 text-center shadow-2xl transform hover:scale-105 transition">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('landing.faqTitle')}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('landing.faqSubtitle')}
            </p>
            <button
              onClick={navigateToFAQ}
              className="bg-white text-orange-500 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-lg transform hover:-translate-y-1"
            >
              {t('landing.faqButton')}
            </button>
          </div>
        </div>

        <div className="text-center py-8">
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('landing.cta')}
          </button>
        </div>
      </div>

      <Footer onCreateEventClick={onGetStarted} onSignInClick={onGetStarted} />
    </div>
  );
}
