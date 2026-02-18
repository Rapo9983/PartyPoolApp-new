import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Globe, LogOut, LayoutDashboard } from 'lucide-react';

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
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-[10000] h-16 sm:h-20 flex items-center border-b border-gray-100">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-1">
          
          {/* LOGO - shrink-0 impedisce al logo di rimpicciolirsi troppo */}
          <button
            onClick={onDashboardClick}
            className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
          >
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-1.5 rounded-lg group-hover:scale-110 transition shadow-sm">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent tracking-tighter">
              PartyPool
            </span>
          </button>

          {/* MENU CENTRALE - Solo Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => navigateToPage('/how-it-works')}
              className="text-gray-600 hover:text-orange-500 font-medium transition text-sm"
            >
              {t('landing.howItWorksTitle')}
            </button>
            <button
              onClick={() => navigateToPage('/faq')}
              className="text-gray-600 hover:text-orange-500 font-medium transition text-sm"
            >
              FAQ
            </button>
          </div>

          {/* AZIONI DESTRA */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            
            {/* Lingua: solo icona su mobile */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
              title={language === 'it' ? 'Switch to English' : 'Passa a Italiano'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden sm:inline">{language}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Dashboard Button */}
                <button
                  onClick={onDashboardClick}
                  className="p-2 sm:px-4 sm:py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all flex items-center gap-2"
                >
                  <LayoutDashboard size={20} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline text-sm font-bold">{t('landing.myEvents')}</span>
                </button>

                {/* Logout Button - shrink-0 fondamentale qui */}
                <button
                  onClick={() => signOut()}
                  className="p-2 sm:px-4 sm:py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 shrink-0"
                >
                  <LogOut size={20} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline text-sm font-bold">{t('dashboard.signOut')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition shrink-0"
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
