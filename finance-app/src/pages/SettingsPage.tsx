import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Moon, Sun, Download, Trash2, Bell, Shield, Mail, CreditCard, LogOut } from 'lucide-react';
import { useAppStore, type AppLanguage, type AppCurrency } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useChatStore } from '../store/useChatStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTranslation } from 'react-i18next';
import { downloadCSV, getExportLabels } from '../utils/export';
import { clearUserBudgets } from '../utils/userBudgets';
import { ConfirmDialog } from '../components/ConfirmDialog';
import toast from 'react-hot-toast'; // Или ваша библиотека уведомлений

// 1. ВЫНОС КОМПОНЕНТА SWITCH ИЗ ТЕЛА СТРАНИЦЫ
const Switch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-orange-600' : 'bg-gray-200 dark:bg-white/10'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// 2. ВЫНОС ПОВТОРЯЮЩИХСЯ КЛАССОВ СЕКЦИЙ
const SectionWrapper = ({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden"
  >
    {(title || subtitle) && (
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
        {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
    )}
    {children}
  </motion.div>
);

export default function SettingsPage() {
  // 3. ПОДКЛЮЧЕНИЕ К РЕАЛЬНЫМ СТОРАМ
  const navigate = useNavigate();
  const { lang, setLang, currency, setCurrency, isDarkMode, toggleTheme, resetSettings } = useAppStore();
  const { user, logout } = useAuthStore();
  const transactions = useTransactionStore((state) => state.transactions);
  const clearAllTransactions = useTransactionStore((state) => state.clearAllTransactions);
  const clearChat = useChatStore((state) => state.clearChat);
  const clearCategories = useCategoryStore((state) => state.clearCategories);
  const emailAlerts = useNotificationStore((state) => state.emailAlerts);
  const monthlyReports = useNotificationStore((state) => state.monthlyReports);
  const toggleEmailAlerts = useNotificationStore((state) => state.toggleEmailAlerts);
  const toggleMonthlyReports = useNotificationStore((state) => state.toggleMonthlyReports);
  const resetNotifications = useNotificationStore((state) => state.resetNotifications);
  const { t } = useTranslation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Раньше кнопка "Sign Out" ниже вызывала просто logout() без навигации — из-за этого
  // после выхода срабатывал защитный редирект RequireAuth (App.tsx) на /auth, а не переход
  // на лендинг, как в Sidebar. Теперь оба места выхода ведут себя одинаково.
  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  // 4. ЭКСПОРТ ДАННЫХ
  const handleExport = () => {
    const result = downloadCSV(transactions, {
      delimiter: ',',
      labels: getExportLabels(t),
    });
    if (result.success) toast.success(t('settings.exportSuccess'));
    else toast.error(t(result.error === 'empty' ? 'export.empty' : 'export.failed'));
  };

  // 5. ДИНАМИЧЕСКИЕ ИНИЦИАЛЫ ПРОФИЛЯ
  const getInitials = (name?: string) => {
    if (!name) return 'GU';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // 6. УДАЛЕНИЕ ВСЕХ ДАННЫХ
  // Само удаление выполняем только после подтверждения в ConfirmDialog.
  const handleDeleteEverything = () => {
    // Транзакции, чат и категории живут в zustand — чистим их экшенами,
    // чтобы persist сразу перезаписал localStorage.
    clearAllTransactions();
    clearChat();
    clearCategories();
    resetNotifications();

    // Бюджеты хранятся в localStorage отдельно от zustand (см. BudgetsPage)
    clearUserBudgets();

    // Настройки (тема/язык/валюта) — к дефолту, затем выход.
    // logout() дополнительно шлёт событие auth-logout, которое тоже сбрасывает useAppStore.
    resetSettings();
    logout();
    setIsDeleteOpen(false);
    toast.success(t('settings.deleteSuccess'));
    navigate('/');
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 space-y-6">
      
      {/* 6. РЕАЛЬНЫЙ ПРОФИЛЬ */}
      <SectionWrapper>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {user?.name || t('settings.guestUser')}
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {user?.role === 'guest' ? t('settings.temporarySession') : user?.email}
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300">
                {user?.role === 'guest' ? t('settings.guestBadge') : t('settings.proBadge')}
              </div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            {t('settings.signOut')}
          </button>
        </div>
      </SectionWrapper>

      {/* 7. ИСПРАВЛЕННЫЕ ПРЕФЕРЕНСЫ (СИНХРОНИЗАЦИЯ СО СТОРОМ) */}
      <SectionWrapper title={t('settings.preferencesTitle')} subtitle={t('settings.preferencesSubtitle')}>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          
          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.language')}</p>
                <p className="text-sm text-gray-500">{t('settings.languageDesc')}</p>
              </div>
            </div>
            {/* Добавлен польский язык и исправлены option */}
            <select
              aria-label={t('settings.language')}
              value={lang}
              onChange={(e) => setLang(e.target.value as AppLanguage)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.currency')}</p>
                <p className="text-sm text-gray-500">{t('settings.currencyDesc')}</p>
              </div>
            </div>
            {/* Валюта теперь берется из глобального стора */}
            <select
              aria-label={t('settings.currency')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as AppCurrency)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="PLN">PLN (zł)</option>
              <option value="RUB">RUB (₽)</option>
            </select>
          </div>

          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.appearance')}</p>
                <p className="text-sm text-gray-500">{t('settings.appearanceDesc')}</p>
              </div>
            </div>
            {/* Теперь тему можно переключать прямо отсюда! */}
            <Switch checked={isDarkMode} onChange={toggleTheme} />
          </div>

        </div>
      </SectionWrapper>

      {/* Уведомления */}
      <SectionWrapper title={t('settings.notificationsTitle')}>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.emailAlerts')}</p>
                <p className="text-sm text-gray-500">{t('settings.emailAlertsDesc')}</p>
              </div>
            </div>
            <Switch checked={emailAlerts} onChange={toggleEmailAlerts} />
          </div>

          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.monthlyReports')}</p>
                <p className="text-sm text-gray-500">{t('settings.monthlyReportsDesc')}</p>
              </div>
            </div>
            <Switch checked={monthlyReports} onChange={toggleMonthlyReports} />
          </div>
        </div>
      </SectionWrapper>

      {/* 8. ИСПРАВЛЕННАЯ ДАННЫЕ И ЭКСПОРТ */}
      <SectionWrapper title={t('settings.dataPrivacyTitle')} subtitle={t('settings.dataPrivacySubtitle')}>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <div className="p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500">
                <Download size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.exportData')}</p>
                <p className="text-sm text-gray-500">{t('settings.exportDataDesc')}</p>
              </div>
            </div>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('settings.download')}
            </button>
          </div>

          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600">
                <Shield size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.dangerZone')}</p>
                <p className="text-sm text-gray-500">{t('settings.dangerZoneDesc')}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              {t('settings.deleteEverything')}
            </button>
          </div>
        </div>
      </SectionWrapper>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t('settings.deleteEverything')}
        description={t('settings.deleteConfirm')}
        confirmLabel={t('settings.deleteEverything')}
        onConfirm={handleDeleteEverything}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}