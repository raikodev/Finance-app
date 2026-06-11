import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Globe, Moon, Sun, Download, Trash2, 
  Bell, Shield, Mail, CreditCard 
} from 'lucide-react';

import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { downloadCSV } from '../utils/export';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function SettingsPage() {
  const { lang, setLang, isDarkMode } = useAppStore();
  
  // ДОБАВЛЕНО: Достаем транзакции из хранилища, чтобы было что скачивать!
  const transactions = useTransactionStore((state) => state.transactions);
  
  // В реальном приложении здесь были бы реальные стейты/функции из ваших сторов
  const [currency, setCurrency] = useState('USD');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);

  // Компонент-переключатель (Toggle)
  const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      type="button"
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121214] ${
        checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-white/10'
      }`}
    >
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
        checked ? 'left-6 shadow-sm' : 'left-1'
      }`} />
    </button>
  );

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-6 pb-12 mx-auto">
      
      {/* ШАПКА */}
      <div className="flex flex-col mt-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences and app settings.
        </p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
        
        {/* 1. ПРОФИЛЬ */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                IL
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Ilyar</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">ilyar@example.com</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white text-[13px] font-medium rounded-lg border border-gray-200 dark:border-white/10 transition-colors shadow-sm">
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* 2. ПРЕДПОЧТЕНИЯ (Язык, Валюта, Тема) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.04]">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Preferences</h3>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
            
            {/* Язык */}
            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Language</p>
                  <p className="text-[12px] text-gray-500">Select your preferred interface language</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
              >
                <option value="en" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>English</option>
                <option value="ru" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>Русский</option>
              </select>
              </div>
            </div>

            {/* Валюта */}
            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Base Currency</p>
                  <p className="text-[12px] text-gray-500">Your primary currency for reports</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
                >
                  <option value="USD" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>USD ($)</option>
                  <option value="EUR" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>EUR (€)</option>
                  <option value="GBP" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>GBP (£)</option>
                  <option value="PLN" style={{ background: isDarkMode ? '#121214' : '#fff', color: isDarkMode ? '#fff' : '#111827' }}>PLN (zł)</option>
                </select>
              </div>
            </div>

            {/* Тема */}
            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-[12px] text-gray-500">Toggle dark mode appearance (controlled via sidebar)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10">
                  {isDarkMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 3. УВЕДОМЛЕНИЯ */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.04]">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
            
            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-[12px] text-gray-500">Receive alerts for big expenses and budget limits</p>
                </div>
              </div>
              <Switch checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
            </div>

            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Monthly Reports</p>
                  <p className="text-[12px] text-gray-500">Send detailed financial reports to your email</p>
                </div>
              </div>
              <Switch checked={monthlyReports} onChange={() => setMonthlyReports(!monthlyReports)} />
            </div>

          </div>
        </motion.div>

        {/* 4. ДАННЫЕ И БЕЗОПАСНОСТЬ (DANGER ZONE) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.04]">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Data & Privacy</h3>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
            
            {/* Экспорт */}
            <div className="p-5 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Download size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-[12px] text-gray-500">Download all your transactions as a CSV file</p>
                </div>
              </div>
              
              {/* ДОБАВЛЕНО: onClick={() => downloadCSV(transactions)} */}
              <button 
                onClick={() => downloadCSV(transactions)} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>

            </div>

            {/* DANGER ZONE */}
            <div className="p-5 bg-rose-50/30 dark:bg-rose-500/[0.02]">
              <div className="flex items-start gap-4 p-4 border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                  <Shield size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-bold text-rose-900 dark:text-rose-400 mb-1">Danger Zone</h4>
                  <p className="text-[12px] text-rose-700/70 dark:text-rose-400/70 mb-4">
                    Permanently delete all your transactions, budgets, and settings from this browser. This action cannot be undone.
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121214]">
                    <Trash2 size={16} />
                    Delete Everything
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}