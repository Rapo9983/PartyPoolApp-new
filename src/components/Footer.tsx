import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Calendar, HelpCircle, LogIn, Coffee } from 'lucide-react';

interface FooterProps {
  onCreateEventClick?: () => void;
  onSignInClick?: () => void;
}

export default function Footer({ onCreateEventClick, onSignInClick }: FooterProps) {
  const { t } = useLanguage();

  const navigateToPage = (path: string) => {
    window.history.pushState({}, '', path);
    window.location.href = path;
  };

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                {t('app.name')}
              </h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              {t('footer.tagline')}
            </p>
            <a
              href="https://buymeacoffee.com/partypool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFDD00] hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-semibold transition text-sm"
            >
              <Coffee className="w-4 h-4" />
              {t('footer.buyCoffee')}
            </a>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {onCreateEventClick && (
                <li>
                  <button
                    onClick={onCreateEventClick}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition justify-center md:justify-start mx-auto md:mx-0"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('dashboard.createEvent')}
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => navigateToPage('/how-it-works')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition justify-center md:justify-start mx-auto md:mx-0"
                >
                  {t('landing.howItWorksTitle')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('/faq')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition justify-center md:justify-start mx-auto md:mx-0"
                >
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </button>
              </li>
              {onSignInClick && (
                <li>
                  <button
                    onClick={onSignInClick}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition justify-center md:justify-start mx-auto md:mx-0"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('landing.signIn')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-2">{t('footer.ctaTitle')}</h4>
              <p className="text-gray-400 text-sm mb-4">{t('footer.ctaDescription')}</p>
              {onCreateEventClick ? (
                <button
                  onClick={onCreateEventClick}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition"
                >
                  {t('footer.ctaButton')}
                </button>
              ) : (
                <a
                  href="/"
                  className="block w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition text-center"
                >
                  {t('footer.ctaButton')}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center gap-4 text-sm text-gray-400 mb-4">
            <p className="text-center text-xs">
              In qualità di affiliato, PartyPool riceve un guadagno dagli acquisti idonei. Questo non influisce sul prezzo finale del tuo regalo.
            </p>
            <div className="flex gap-4">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 {t('app.name')} - {t('footer.copyright')} | <a href="mailto:info@partypoolapp.com" className="hover:text-white transition">info@partypoolapp.com</a></p>
            <p className="text-center md:text-right">{t('footer.madeWith')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
