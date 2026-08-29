import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Fingerprint, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

const PAGE_CONTENT = {
  en: { welcome: 'Welcome back', subtitle: 'Enter your credentials to access your account', emailLabel: 'Email address', emailPlaceholder: 'name@example.com', passwordLabel: 'Password', passwordPlaceholder: 'Enter your password', forgot: 'Forgot password?', btnContinue: 'Sign In', or: 'Or continue with', btnGoogle: 'Google', btnGuest: 'View as Guest', noSignup: 'Limited access', loading: 'Authenticating...' },
  ru: { welcome: 'С возвращением', subtitle: 'Введите свои данные для входа в систему', emailLabel: 'Email адрес', emailPlaceholder: 'name@example.com', passwordLabel: 'Пароль', passwordPlaceholder: 'Введите ваш пароль', forgot: 'Забыли пароль?', btnContinue: 'Войти', or: 'Или войдите через', btnGoogle: 'Google', btnGuest: 'Войти как Гость', noSignup: 'Ограниченный доступ', loading: 'Вход...' },
  pl: { welcome: 'Witaj ponownie', subtitle: 'Wprowadź swoje dane, aby uzyskać dostęp', emailLabel: 'Adres email', emailPlaceholder: 'name@example.com', passwordLabel: 'Hasło', passwordPlaceholder: 'Wprowadź swoje hasło', forgot: 'Zapomniałeś hasła?', btnContinue: 'Zaloguj się', or: 'Lub kontynuuj przez', btnGoogle: 'Google', btnGuest: 'Wejdź jako Gość', noSignup: 'Ograniczony dostęp', loading: 'Logowanie...' }
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // RequireAuth (App.tsx) сохраняет сюда путь, с которого неавторизованного
  // пользователя редиректнуло на /auth — возвращаем его туда же после входа.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';
  const { lang } = useAppStore();
  const t = PAGE_CONTENT[lang];
  const { loginWithEmail, loginAsGuest, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const brandBg = "bg-[#FF4500]";
  const brandHover = "hover:bg-[#E63E00]";
  const brandText = "text-[#FF4500]";
  const brandRing = "focus:ring-[#FF4500]";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!formData.email || !formData.password) return toast.error('Please fill in all fields');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');

    const mockName = formData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    const capitalizedName = mockName.charAt(0).toUpperCase() + mockName.slice(1);

    try {
      await loginWithEmail(capitalizedName || 'User', formData.email);
      toast.success('Successfully logged in!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      toast.success('Logged in as Guest');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Failed to enter guest mode');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-4 font-sans selection:bg-[#FF4500]/30">
      
      {/* Огненные фоновые свечения */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#FF4500]/20 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px] relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className={`w-12 h-12 ${brandBg} rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,69,0,0.4)] mb-4`}>
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clarity</h1>
        </div>

        <div className="bg-[#121214] border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-1">{t.welcome}</h2>
            <p className="text-sm text-gray-400">{t.subtitle}</p>
          </div>

          {error && <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium text-center">{error}</div>}

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-400 pl-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t.emailPlaceholder} disabled={isLoading} className={`w-full bg-[#0A0A0C] border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 ${brandRing} focus:border-transparent outline-none transition-all disabled:opacity-50`} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-400">{t.passwordLabel}</label>
                <button type="button" onClick={() => toast.success('Recovery email sent')} className={`text-xs font-medium ${brandText} hover:text-white transition-colors`}>{t.forgot}</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={t.passwordPlaceholder} disabled={isLoading} className={`w-full bg-[#0A0A0C] border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 ${brandRing} focus:border-transparent outline-none transition-all disabled:opacity-50`} required />
              </div>
            </div>

            <button type="submit" disabled={isLoading || !formData.email || !formData.password} className={`w-full ${brandBg} ${brandHover} text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,69,0,0.3)] mt-2`}>
              {isLoading ? t.loading : t.btnContinue}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.or}</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => toast('OAuth coming soon', { icon: '🛠️' })} disabled={isLoading} className="w-full bg-[#0A0A0C] hover:bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
              <Fingerprint size={18} className="text-gray-400" />
              {t.btnGoogle}
            </button>
            <button type="button" onClick={handleGuestLogin} disabled={isLoading} className="w-full bg-[#0A0A0C] hover:bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 group">
              <UserCircle size={18} className="text-gray-400 group-hover:text-white transition-colors" />
              <div className="flex flex-col items-start leading-tight">
                <span>{t.btnGuest}</span>
                <span className="text-[10px] text-gray-500">{t.noSignup}</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}