import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, PieChart, Wallet, BarChart3, Settings, Sparkles, Wallet as WalletIcon, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { APP_T } from '../locales/translations';

export default function Sidebar() {
  const { isDarkMode, lang, toggleTheme } = useAppStore();
  const { logout } = useAuthStore();
  const t = APP_T[lang] || APP_T['en'];

  const menuItems = [
    { path: '/', name: t.menu.dash, Icon: LayoutDashboard },
    { path: '/transactions', name: t.menu.tx, Icon: ArrowRightLeft },
    { path: '/categories', name: t.menu.cat, Icon: PieChart },
    { path: '/budgets', name: t.menu.bud, Icon: Wallet },
    { path: '/ai-assistant', name: t.menu.ai, Icon: Sparkles }, 
    { path: '/reports', name: t.menu.rep, Icon: BarChart3 },
    { path: '/settings', name: t.menu.set, Icon: Settings },
  ];

  return (
    // 1. Уменьшена ширина (w-56 = 224px вместо 280px). Фон сделан чуть более плотным для читаемости.
    <aside className="w-56 bg-white dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-white/10 flex flex-col justify-between shrink-0 hidden md:flex z-20">
      {/* 2. Уменьшены глобальные паддинги (py-5 px-3 вместо py-8 px-5) */}
      <div className="py-5 px-3">
        
        {/* ЛОГОТИП С УТОНЧЕННЫМ GLOW-ЭФФЕКТОМ */}
        <div className="flex items-center gap-2.5 px-3 mb-8 group cursor-pointer">
          <div className="relative flex-shrink-0">
            {/* Свечение сделано более тонким и аккуратным */}
            <div className="absolute inset-0 bg-indigo-500 blur-[6px] opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            {/* Уменьшен паддинг иконки (p-1.5) */}
            <div className="relative bg-gradient-to-b from-indigo-500 to-indigo-600 p-1.5 rounded-lg text-white border border-indigo-400/30 shadow-sm">
              <WalletIcon size={18} strokeWidth={2.5} />
            </div>
          </div>
          {/* Шрифт логотипа уменьшен до text-lg для солидности */}
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
            Finance<span className="text-indigo-500 dark:text-indigo-400">App</span>
          </span>
        </div>

        {/* НАВИГАЦИЯ */}
        {/* gap-1 вместо gap-2 для плотности */}
        <nav className="flex flex-col gap-1">
          {/* Более компактный заголовок меню */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-1.5">
            Main Menu
          </div>
          
          {/* Итерация по меню */}
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              // Уменьшен вертикальный отступ (py-1.5 вместо py-2.5)
              className="relative flex items-center px-3 py-1.5 w-full outline-none group rounded-md"
            >
              {({ isActive }) => {
                const IconComponent = item.Icon;
                return (
                  <>
                    {/* Плавающая подложка (Sliding Background) - стиль Vercel/Linear */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-md"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    
                    {/* Контент ссылки */}
                    <div className="relative z-10 flex items-center gap-2.5 w-full">
                      <IconComponent 
                        size={16} // Иконки чуть меньше (16px)
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-colors duration-200 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} 
                      />
                      <span className={`text-sm transition-colors duration-200 ${isActive ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}`}>
                        {item.name}
                      </span>
                    </div>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ: УПЛОТНЕННАЯ */}
      {/* p-3 space-y-1 mb-2 для экономии места */}
      <div className="p-3 space-y-1.5 mb-2">
        
        {/* Переключатель темы */}
        <div 
          onClick={toggleTheme} 
          className="flex items-center justify-between px-3 py-2 bg-transparent rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white text-sm font-medium transition-colors">
            <Moon size={16} strokeWidth={2} /> 
            <span>{t.mode}</span>
          </div>
          {/* Уменьшенный свитчер (как в iOS/macOS настройках) */}
          <div className={`w-8 h-4.5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-3.5' : ''}`}></div>
          </div>
        </div>

        {/* Профиль пользователя */}
        <div 
          onClick={logout} 
          className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
        >
          <div className="relative">
            {/* Аватарка чуть меньше (w-8 h-8) */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold shadow-inner group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:from-rose-100 group-hover:to-rose-200 transition-all border border-white/50 dark:border-white/10">
              IL
            </div>
            {/* Уменьшенный онлайн-индикатор */}
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-[1.5px] border-white dark:border-[#0c0c0e] rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col leading-tight">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Ilyar</p>
            <p className="text-[10px] font-medium text-gray-400 group-hover:text-rose-500/70 transition-colors">Sign Out</p>
          </div>
        </div>

      </div>
    </aside>
  );
}