import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import Lenis from '@studio-freight/lenis';

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

const ChunkErrorFallback = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 min-h-screen">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load content</h2>
    <p className="text-gray-500 mb-4">Please check your connection and try again.</p>
    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-600 transition-colors">
      Reload Page
    </button>
  </div>
);

// --- ЛОГИКА ТЕМЫ (ИЗОЛИРОВАННАЯ) ---

function ThemeProvider({ children }: { children: React.ReactNode }) {
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

// --- ЛОГИКА АВТОРИЗАЦИИ И СОХРАНЕНИЯ МАРШРУТА ---

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    // Сохраняем URL, куда хотел попасть пользователь, чтобы вернуть его после логина
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Главный Layout для авторизованной зоны (с сайдбаром и скроллом)
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0A0A0C] font-sans transition-colors duration-500">
      <aside className="sticky top-0 h-screen shrink-0 z-50">
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
  // Инициализация Lenis (Smooth Scroll)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}