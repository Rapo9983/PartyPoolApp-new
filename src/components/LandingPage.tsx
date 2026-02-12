import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Share2, Plus, Sparkles, ChevronDown } from 'lucide-react';
import Footer from './Footer';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: t('landing.faq1Question'),
      answer: t('landing.faq1Answer'),
    },
    {
      question: t('landing.faq2Question'),
      answer: t('landing.faq2Answer'),
    },
    {
      question: t('landing.faq3Question'),
      answer: t('landing.faq3Answer'),
    },
    {
      question: t('landing.faq4Question'),
      answer: t('landing.faq4Answer'),
    },
  ];

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

        <div id="faq-section" className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {t('landing.faqTitle')}
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
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
