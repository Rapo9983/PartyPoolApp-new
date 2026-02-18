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
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <button
            onClick={onDashboardClick}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition shadow-sm">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              PartyPool
            </span>
          </button>

          {/* AZIONI DESTRA */}
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            
            {/* Lingua */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
              title={language === 'it' ? 'Switch to English' : 'Passa a Italiano'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden xs:inline">{language}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-0.5 sm:gap-2">
                {/* Dashboard: icona su mobile, testo su desktop */}
                <button
                  onClick={onDashboardClick}
                  className="p-2 sm:px-4 sm:py-2 text-gray-700 hover:text-orange-500 font-medium transition flex items-center gap-2"
                >
                  <LayoutDashboard size={20} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline text-sm">{t('landing.myEvents')}</span>
                </button>
                
                {/* Logout: icona rossa su mobile per chiarezza */}
                <button
                  onClick={() => signOut()}
                  className="p-2 sm:px-4 sm:py-2 text-red-500 md:text-gray-700 md:hover:text-orange-500 font-medium transition flex items-center gap-2 shrink-0"
                >
                  <LogOut size={20} className="sm:w-4 sm:h-4" />
                  <span className="hidden md:inline text-sm">{t('dashboard.signOut')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-pink-600 transition shrink-0 shadow-sm"
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
