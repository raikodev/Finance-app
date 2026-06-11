import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { APP_T } from './locales/translations';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// ДОБАВЛЕН ИМПОРТ НОВОЙ СТРАНИЦЫ
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage')); 

const PageLoader = () => (
  <div className="flex h-full flex-1 items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
  </div>
);

function AppRoutes() {
  const { isDarkMode, lang } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const t = APP_T[lang] || APP_T['en'];
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) { 
      document.documentElement.classList.add('dark'); 
    } else { 
      document.documentElement.classList.remove('dark'); 
    }
  }, [isDarkMode]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage onStart={() => navigate('/auth')} />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0A0A0C] font-sans overflow-hidden transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:px-6 md:py-5 text-gray-900 dark:text-gray-100 relative flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/ai-assistant" element={<AIAssistant lang={lang} t={t.ai} />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* ПОДКЛЮЧИЛИ СТРАНИЦУ КАТЕГОРИЙ ВМЕСТО ЗАГЛУШКИ */}
            <Route path="/categories" element={<CategoriesPage />} /> 
            
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// function ConstructionPage({ title, icon }: { title: string, icon: React.ReactNode }) {
//   return (
//     <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-300">
//       <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-full mb-4 text-gray-400">
//         {icon}
//       </div>
//       <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
//       <p className="text-gray-500 dark:text-gray-400">This page is currently under construction.</p>
//     </div>
//   );
// }