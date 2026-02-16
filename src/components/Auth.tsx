import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogIn, UserPlus, Gift } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccessMessage(t('auth.resetEmailSent'));
        setEmail('');
      } else if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage('it')}
          className={`text-3xl transition-all duration-200 ${
            language === 'it' ? 'scale-125 drop-shadow-lg' : 'opacity-50 hover:opacity-100'
          }`}
          title="Italiano"
        >
          🇮🇹
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`text-3xl transition-all duration-200 ${
            language === 'en' ? 'scale-125 drop-shadow-lg' : 'opacity-50 hover:opacity-100'
          }`}
          title="English"
        >
          🇬🇧
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-full">
            <Gift className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
          {t('app.name')}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isForgotPassword ? t('auth.resetTitle') : isLogin ? t('auth.welcome') : t('auth.create')}
        </p>

        {isForgotPassword && (
          <p className="text-center text-gray-500 text-sm mb-6">
            {t('auth.resetDescription')}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm text-orange-600 hover:text-orange-700 transition"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              t('common.loading')
            ) : isForgotPassword ? (
              t('auth.sendResetLink')
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                {t('auth.signIn')}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {t('auth.signUp')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setSuccessMessage('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium transition"
            >
              {t('auth.backToLogin')}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium transition"
            >
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
