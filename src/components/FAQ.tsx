import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQProps {
  onBack: () => void;
  onCreateEvent?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ onBack, onCreateEvent }: FAQProps) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: t('faq.question1'),
      answer: t('faq.answer1'),
    },
    {
      question: t('faq.question2'),
      answer: t('faq.answer2'),
    },
    {
      question: t('faq.question3'),
      answer: t('faq.answer3'),
    },
    {
      question: t('faq.question4'),
      answer: t('faq.answer4'),
    },
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('event.backButton')}
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {t('faq.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
              >
                <span className="text-lg font-semibold text-gray-800 pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 pt-2 text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">
            {t('faq.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('faq.ctaSubtitle')}
          </p>
          {onCreateEvent ? (
            <button
              onClick={onCreateEvent}
              className="bg-white text-orange-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              {t('faq.ctaButton')}
            </button>
          ) : (
            <a
              href="/"
              className="inline-block bg-white text-orange-500 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              {t('faq.ctaButton')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
