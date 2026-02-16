import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Gift, Check } from 'lucide-react';

interface ResetPasswordProps {
  onPasswordUpdated: () => void;
}

export default function ResetPassword({ onPasswordUpdated }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        onPasswordUpdated();
      }, 2000);
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
          {t('auth.resetPassword')}
        </p>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <Check className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <p className="text-green-700 font-medium">
              {t('auth.passwordUpdated')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('auth.savePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
