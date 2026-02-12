import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Globe } from 'lucide-react';

interface NavbarProps {
  onSignInClick?: () => void;
  onDashboardClick?: () => void;
}

function navigateToPage(path: string) {
  window.history.pushState({}, '', path);
  window.location.href = path;
}

export default function Navbar({ onSignInClick, onDashboardClick }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onDashboardClick}
            className="flex items-center gap-2 group"
          >
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-lg group-hover:scale-110 transition">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              PartyPool
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigateToPage('/how-it-works')}
              className="text-gray-700 hover:text-orange-500 font-medium transition"
            >
              {t('landing.howItWorksTitle')}
            </button>
            <button
              onClick={() => navigateToPage('/faq')}
              className="text-gray-700 hover:text-orange-500 font-medium transition"
            >
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
              title={language === 'it' ? 'Switch to English' : 'Passa a Italiano'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onDashboardClick}
                  className="px-4 py-2 text-gray-700 hover:text-orange-500 font-medium transition"
                >
                  {t('landing.myEvents')}
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-gray-700 hover:text-orange-500 font-medium transition"
                >
                  {t('dashboard.signOut')}
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition"
              >
                {t('landing.signIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
