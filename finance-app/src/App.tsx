import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';
import { useExchangeRatesStore } from './store/useExchangeRatesStore';
import { useSessionExpiry } from './hooks/useSessionExpiry';

import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';

// Ленивая загрузка
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// --- КОМПОНЕНТЫ СОСТОЯНИЙ ---

const PageLoader = () => (
  <div className="flex h-full flex-1 items-center justify-center min-h-screen">
    <Loader2 className="animate-spin text-orange-600 dark:text-orange-400" size={32} />
  </div>
);

const ChunkErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 min-h-screen">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('common.loadFailed')}</h2>
      <p className="text-gray-500 mb-4">{t('common.loadFailedDesc')}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-600 transition-colors">
        {t('common.reload')}
      </button>
    </div>
  );
};

// --- ЛОГИКА ТЕМЫ (ИЗОЛИРОВАННАЯ) ---

function ThemeProvider({ children }: { children: ReactNode }) {
  // Селектор: перерисовка только при смене isDarkMode
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

// --- СИНХРОНИЗАЦИЯ ЯЗЫКА С i18next ---
// useAppStore.lang остаётся единственным источником правды (persist в localStorage,
// переключатели языка в Sidebar/Dashboard/Settings меняют именно его) — i18next
// просто следует за ним реактивно, а не хранит своё отдельное состояние языка.

function LanguageSync({ children }: { children: ReactNode }) {
  const lang = useAppStore((state) => state.lang);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return <>{children}</>;
}

// --- ЛОГИКА АВТОРИЗАЦИИ И СОХРАНЕНИЯ МАРШРУТА ---

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    // Раньше редиректило на /auth — но это создавало гонку с явным navigate('/')
    // в обработчиках логаута (Sidebar/SettingsPage): их вызов и этот редирект
    // иногда "спорили" за то, куда переходить, и /auth побеждал непредсказуемо.
    // Теперь оба пути ведут на одно и то же место — гонка больше не имеет значения.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Главный Layout для авторизованной зоны (с сайдбаром и скроллом)
  // На мобильном раскладка идёт КОЛОНКОЙ (Sidebar рендерит верхний бар, а не боковую
  // панель), поэтому aside больше не требует h-screen/sticky ниже md — раньше это
  // создавало на мобильном "невидимую" колонку на всю высоту экрана рядом с контентом.
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-[#0A0A0C] font-sans transition-colors duration-500">
      <aside className="md:sticky md:top-0 md:h-screen shrink-0 z-[150]">
        <Sidebar />
      </aside>
      <main className="flex-1 flex flex-col min-w-0 p-4 md:px-6 md:py-5 text-gray-900 dark:text-gray-100">
        <ErrorBoundary FallbackComponent={ChunkErrorFallback}>
          <Suspense fallback={<PageLoader />}>
            <Outlet /> {/* Здесь рендерятся вложенные роуты (Dashboard и т.д.) */}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

// --- ОСНОВНОЙ РОУТИНГ ---

function AppRoutes() {
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const navigate = useNavigate();
  
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to="/dashboard" replace /> 
            : <LandingPage onStart={() => navigate('/auth')} />
        } 
      />
      <Route path="/auth" element={<AuthPage />} />

      {/* Защищенные маршруты (Вложенная архитектура) */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        
        {/* Прокидываем необходимые пропсы в AIAssistant */}
        <Route path="/ai-assistant" element={<AIAssistant />} /> 
        
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Следим за sessionExpiresAt и разлогиниваем открытую вкладку без перезагрузки.
  useSessionExpiry();

  // Загружаем живые курсы валют один раз при старте приложения. Стор сам
  // защищён от повторных запросов чаще раза в час (см. useExchangeRatesStore) —
  // безопасно вызывать даже если компонент перемонтируется.
  const fetchRates = useExchangeRatesStore((state) => state.fetchRates);
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Инициализация Lenis (Smooth Scroll)
  useEffect(() => {
    // Пользователям с prefers-reduced-motion плавный скролл не нужен:
    // оставляем нативный скролл браузера и не запускаем rAF-цикл.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <LanguageSync>
            <AppRoutes />
          </LanguageSync>
        </ThemeProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}