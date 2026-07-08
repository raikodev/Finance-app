import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Receipt, 
  Layers, 
  PiggyBank, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Sun, 
  Moon, 
  LogOut, 
  Hexagon,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../locales/translations';

export default function Sidebar() {
  const lang = useAppStore(s => s.lang);
  const isDarkMode = useAppStore(s => s.isDarkMode);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  
  // 1. ДИНАМИЧЕСКИЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (Конец хардкоду)
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  
  const navigate = useNavigate();
  const t = useTranslation(lang);
  
  // Состояние мобильного меню (для планшетов/телефонов)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.name || 'Guest User';
  
  // Вычисляем инициалы динамически
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'GU';

  // 2. СТРУКТУРИРОВАННОЕ МЕНЮ С ПРАВИЛЬНЫМИ ИКОНКАМИ (PiggyBank для бюджетов)
  const menuItems = [
    { path: '/dashboard', name: t.menu.dash, icon: LayoutDashboard },
    { path: '/transactions', name: t.menu.tx, icon: Receipt },
    { path: '/categories', name: t.menu.cat, icon: Layers },
    { path: '/budgets', name: t.menu.bud, icon: PiggyBank },
    { path: '/reports', name: t.menu.rep, icon: BarChart3 },
    { path: '/ai-assistant', name: t.menu.ai, icon: Sparkles },
    { path: '/settings', name: t.menu.set, icon: Settings },
  ];

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем клик по карточке профиля
    if (confirm(lang === 'ru' ? 'Выйти из системы?' : 'Sign out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 3. ДЕСКТОПНАЯ НАВИГАЦИЯ (md:flex)                                          */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-50 dark:bg-[#0A0A0C] border-r border-gray-200 dark:border-white/5 p-4 justify-between shrink-0">
        <div className="space-y-6">
          {/* Логотип бренда Clarity (Уничтожен FinanceApp и Nickel из кода) */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="bg-orange-500 rounded-xl p-2 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Hexagon size={20} className="fill-white/20 animate-pulse" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
              Clarity<span className="text-orange-500">.</span>
            </span>
          </div>

          {/* Секция навигации */}
          <nav className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-2">
              {lang === 'ru' ? 'Главное меню' : lang === 'pl' ? 'Menu główne' : 'Main Menu'}
            </div>
            
            <AnimatePresence mode="popLayout">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive 
                        ? 'text-orange-600 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Интерактивная пилюля активного пункта на Framer Motion */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 bg-orange-500/10 dark:bg-white/5 border border-orange-500/20 dark:border-white/10 rounded-xl"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      <item.icon size={18} className={`z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span className="z-10">{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </AnimatePresence>
          </nav>
        </div>

        {/* Нижняя часть: Переключатель темы и Профиль */}
        <div className="space-y-4">
          {/* Интуитивный переключатель темы (Луна в светлой теме, Солнце в тёмной) */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/5"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-orange-500" />}
              <span>{t.mode}</span>
            </div>
          </button>

          {/* Карточка профиля пользователя */}
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center justify-between p-2.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer hover:border-orange-500/30 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {initials}
                {/* Честный онлайн-статус (на Демо всегда зелёный, но теперь аккуратный) */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#121214] rounded-full"></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] font-medium text-gray-400 truncate mt-0.5">
                  {user?.email || 'guest@clarity.ai'}
                </p>
              </div>
            </div>
            
            {/* Изолированная кнопка выхода */}
            <button
              onClick={handleLogoutClick}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. МОБИЛЬНАЯ НАВИГАЦИЯ (Верхний бар + Нижний таб-бар в стиле Revolut)      */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0A0A0C] border-b border-gray-200 dark:border-white/5 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 rounded-lg p-1.5 text-white">
            <Hexagon size={16} />
          </div>
          <span className="text-md font-black tracking-tight text-gray-900 dark:text-white">Clarity</span>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Мобильное выпадающее меню на Framer Motion */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-16 bg-white dark:bg-[#0A0A0C] border-b border-gray-200 dark:border-white/10 z-30 p-4 shadow-xl flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-orange-500/10 text-orange-600 dark:text-white border border-orange-500/20' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                <item.icon size={18} />
                <span>item.name</span>
              </NavLink>
            ))}
            
            <div className="h-px bg-gray-100 dark:bg-white/5 my-2" />
            
            <button
              onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-orange-500" />}
              <span>{t.mode}</span>
            </button>

            <button
              onClick={(e) => { setIsMobileMenuOpen(false); handleLogoutClick(e); }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500"
            >
              <LogOut size={18} />
              <span>{lang === 'ru' ? 'Выйти' : lang === 'pl' ? 'Wyloguj' : 'Sign Out'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Отступ под мобильную шапку, чтобы контент страниц не залезал под неё */}
      <div className="md:hidden h-16 w-full" />
    </>
  );
}