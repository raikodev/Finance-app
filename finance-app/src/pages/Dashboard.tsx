import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Plus, Globe, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react';

// Импорт сторов
import { useAppStore, type AppLanguage, type AppCurrency } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTransactionStore, type Transaction } from '../store/useTransactionStore';
import { useExchangeRatesStore } from '../store/useExchangeRatesStore';
import { useDashboardData } from '../hooks/useDashboardData';

// Компоненты
import StatsGrid from '../components/StatsGrid';
import AIHub from '../components/AIHub';
import { TransactionModal } from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';

// recharts тяжёлый (~300 kB), поэтому графики грузим отдельным чанком
// уже после первого рендера дашборда.
const ChartsSection = lazy(() => import('../components/ChartsSection'));

// Скелетон повторяет сетку графиков, чтобы контент не «прыгал» при загрузке чанка.
const ChartsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full" aria-hidden="true">
    <div className="lg:col-span-1 min-h-[320px] rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#121214] shadow-sm animate-pulse" />
    <div className="lg:col-span-2 min-h-[320px] rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#121214] shadow-sm animate-pulse" />
  </div>
);

export default function Dashboard() {
  // 1. ГЛОБАЛЬНЫЕ СТОРЫ
  const { lang, setLang, currency, setCurrency } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const ratesError = useExchangeRatesStore((state) => state.error);
  const ratesLoading = useExchangeRatesStore((state) => state.isLoading);
  const fetchRates = useExchangeRatesStore((state) => state.fetchRates);

  // 2. ДАННЫЕ ДАШБОРДА
  const {
    t,
    filteredTxList,
    displayBalance,
    displayIncome,
    displayExpenses,
    trends,
    formatMoneyString,
    rates,
    pieData,
    areaData
  } = useDashboardData();

  // Локальные состояния
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Единое состояние для дропдаунов (чтобы не открывались оба сразу)
  const [activeDropdown, setActiveDropdown] = useState<'lang' | 'currency' | null>(null);

  // 3. ЕДИНЫЙ REF ДЛЯ ЗАКРЫТИЯ ДРОПДАУНОВ
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. БЕЗОПАСНЫЙ ШОРТКАТ (n = new)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') && 
        e.target instanceof Element && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      ) {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 5. БЕЗОПАСНОЕ ДОБАВЛЕНИЕ ТРАНЗАКЦИИ
  const handleAddTransaction = (txData: Omit<Transaction, 'id'>) => {
    // TransactionModal уже отдаёт строго 'income' | 'expense' (см. TransactionType в сторе).
    // Раньше здесь стояло .charAt(0).toUpperCase()..., которое портило type на 'Income'/'Expense' —
    // из-за этого весь дашборд, графики и AI-инсайты переставали видеть новые транзакции,
    // потому что везде в проекте сравнение идёт как tx.type === 'income' / 'expense'.
    addTransaction({
      ...txData,
      date: txData.date || new Date().toISOString(),
      description: txData.description || t.addTransaction || 'New transaction',
      currency: txData.currency || currency,
    });
    setIsModalOpen(false);
  };

  // 6. ДОСТУПНЫЕ ВАЛЮТЫ ДЛЯ ВЫБОРА
  // Раньше список брался из Object.keys(rates) (все 6 валют в MOCK_RATES, включая
  // GBP/UAH) и приводился через `as any`, хотя AppCurrency разрешает только 4 —
  // из-за этого можно было выбрать валюту, не входящую в тип стора. Теперь список
  // жёстко ограничен тем же набором, что и в SettingsPage.
  const SUPPORTED_CURRENCIES: AppCurrency[] = ['USD', 'EUR', 'PLN', 'RUB'];
  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(c => (rates || {})[c] !== undefined);

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 flex flex-col gap-6">
      
      {/* HEADER с z-[100] для правильного наложения */}
      <header ref={headerRef} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-white/5 relative z-[100]">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {t.welcome || 'Welcome'}, {user?.name || 'Guest'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.subtitle || "Here's what's happening with your finances today."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Language Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Globe size={16} className="text-gray-500" />
              <span className="uppercase">{lang}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            
            {/* z-[200] для меню языка */}
            {activeDropdown === 'lang' && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-[200]">
                {['en', 'pl', 'ru'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l as AppLanguage); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2 text-sm uppercase transition-colors ${
                      lang === l ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'pl' ? 'Polski' : 'Русский'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'currency' ? null : 'currency')}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-gray-500 hidden sm:inline">{t.baseCurrency || 'Base:'}</span>
              <span className="font-bold">{currency}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            
            {/* z-[200] и без overscroll-contain (фиксы скролла) */}
            {activeDropdown === 'currency' && (
              <div
               data-lenis-prevent
               onWheel={(e) => e.stopPropagation()}
               className="absolute right-0 top-full mt-2 w-24 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-[200]"
               >
                {filteredCurrencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCurrency(c); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      currency === c ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Индикатор проблемы с курсами: клик = принудительный retry */}
          {ratesError && (
            <button
              onClick={() => fetchRates(true)}
              disabled={ratesLoading}
              title={t.ratesError}
              aria-label={t.ratesError}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-wait transition-colors shrink-0"
            >
              {ratesLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              <span className="hidden sm:inline">{t.ratesRetry}</span>
            </button>
          )}

          {/* Кнопка добавления транзакции */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm ml-auto sm:ml-0 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t.addTransaction || 'Add'}</span>
          </button>
        </div>
      </header>

      {/* КОНТЕНТ */}
      <StatsGrid 
        displayBalance={displayBalance} 
        displayIncome={displayIncome} 
        displayExpenses={displayExpenses} 
        recordCount={filteredTxList.length}
        currency={currency}
        formatMoneyString={formatMoneyString}
        t={t}
        trends={trends}
      />

{/* ================= ЭТАЖ 1: Графики и AI (Теперь они будут одной высоты) ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Графики (занимают 2/3) */}
        <div className="xl:col-span-2 h-full">
          <Suspense fallback={<ChartsSkeleton />}>
            <ChartsSection 
               t={t}  
               formatMoneyString={formatMoneyString}
               pieData={pieData}                
               areaData={areaData}              
               displayExpenses={displayExpenses}  
            />
          </Suspense>
        </div>
        
        {/* AI Insights (занимает 1/3) */}
        <div className="xl:col-span-1 h-full">
          <AIHub />
        </div>

      </div>

      {/* ================= ЭТАЖ 2: Список транзакций (НА ВСЮ ШИРИНУ) ================= */}
      <div className="w-full">
        <TransactionList 
           transactions={filteredTxList} 
           // Защита от отрицательных сумм в списке
           formatAmount={(amount, cur) => formatMoneyString(Math.abs(amount), cur)} 
           onDelete={deleteTransaction}     
        />
      </div>

      {/* МОДАЛКА */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
      />
    </div>
  );
}