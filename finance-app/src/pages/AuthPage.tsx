import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginAsGuest } = useAuthStore();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Логиним пользователя в состояние Zustand
    loginWithEmail(formData.name || 'New User', formData.email);
    
    // ИСПРАВЛЕНИЕ 1: Меняем '/dashboard' на '/' и добавляем { replace: true }
    navigate('/', { replace: true });
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    // ИСПРАВЛЕНИЕ 2: Тоже меняем путь на '/'
    navigate('/', { replace: true });
  };

  const handleGoogleLogin = () => {
    // Заглушка для будущей интеграции
    alert('Google Auth is coming soon!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to Nickel</h2>
        <p className="text-gray-400 mb-8">Choose how you want to continue.</p>

        {/* Быстрые способы входа */}
        <div className="space-y-3 mb-8">
          <button
            type="button" // ИСПРАВЛЕНИЕ 3: Явное указание type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-medium py-3 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button" // ИСПРАВЛЕНИЕ 3: Явное указание type="button"
            onClick={handleGuestLogin}
            className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white font-medium py-3 rounded-lg transition-colors border border-white/5 cursor-pointer"
          >
            View as Guest (No signup)
          </button>
        </div>

        {/* Разделитель */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#111] text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Ошибки валидации */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Форма Email/Пароль */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <input
              type="password"
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF5722] hover:bg-[#FF7043] text-white font-medium py-3 rounded-lg transition-colors mt-2 cursor-pointer"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}