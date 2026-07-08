import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Plus, Coffee, Home, Car, MonitorPlay, 
  Briefcase, Globe, ShoppingBag, Zap, Folder 
} from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import { getCategoryMeta } from '../utils/categories';

// 1. ЛОКАЛИЗАЦИЯ (i18n)
const PAGE_CONTENT = {
  en: {
    title: 'Categories',
    subtitle: 'Manage and analyze your spending areas.',
    btnAdd: 'Add Category',
    tabExpense: 'Expenses',
    tabIncome: 'Income',
    records: 'records',
    record: 'record',
    noData: 'No data available',
    noDataDesc: 'You don\'t have any records in this category yet.',
    comingSoon: 'Custom categories coming soon!'
  },
  ru: {
    title: 'Категории',
    subtitle: 'Анализируйте ваши доходы и расходы по группам.',
    btnAdd: 'Добавить',
    tabExpense: 'Расходы',
    tabIncome: 'Доходы',
    records: 'записей',
    record: 'запись',
    noData: 'Нет данных',
    noDataDesc: 'В этой вкладке пока нет ни одной транзакции.',
    comingSoon: 'Свои категории появятся скоро!'
  },
  pl: {
    title: 'Kategorie',
    subtitle: 'Zarządzaj i analizuj swoje wydatki.',
    btnAdd: 'Dodaj',
    tabExpense: 'Wydatki',
    tabIncome: 'Przychody',
    records: 'rekordów',
    record: 'rekord',
    noData: 'Brak danych',
    noDataDesc: 'Nie masz jeszcze żadnych transakcji w tej zakładce.',
    comingSoon: 'Własne kategorie wkrótce!'
  }
};

export default function CategoriesPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const { lang, currency } = useAppStore();
  const t = PAGE_CONTENT[lang];

  // Строгие типы, совпадающие с useTransactionStore
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // 3. ЕДИНЫЙ ФОРМАТ ДЕНЕГ (Синхронизирован с TransactionsPage: 2 знака после запятой)
  const formatMoneySafe = (amount: number) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  // 4. БЕЗОПАСНАЯ АНАЛИТИКА ДАННЫХ
  const categoryStats = useMemo(() => {
    // Фильтруем по строгому типу ('income' | 'expense')
    const filtered = transactions.filter(tx => tx.type === activeTab);
    
    const stats: Record<string, { total: number; count: number }> = {};
    let totalSum = 0;

    filtered.forEach(tx => {
      // Защита: берем сумму по модулю, чтобы отрицательные расходы не ломали математику
      const amount = Math.abs(tx.amount);
      if (!stats[tx.category]) {
        stats[tx.category] = { total: 0, count: 0 };
      }
      stats[tx.category].total += amount;
      stats[tx.category].count += 1;
      totalSum += amount;
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        // Математическая защита от 0/0 (NaN) и Infinity
        percentage: totalSum > 0 ? (data.total / totalSum) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
      
    // Зависимости включают lang и currency, чтобы UI обновлялся при их смене!
  }, [transactions, activeTab, lang, currency]);

  // 5. ОЖИВЛЕНИЕ МЕРТВОЙ КНОПКИ
  const handleAddCategory = () => {
    toast(t.comingSoon, { icon: '🚧' });
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 space-y-8">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <button 
          onClick={handleAddCategory}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t.btnAdd}</span>
        </button>
      </div>

      {/* Табы */}
      <div className="flex bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl p-1 w-full max-w-md">
        {(['expense', 'income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'expense' ? t.tabExpense : t.tabIncome}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {categoryStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <PieChart size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t.noData}</h3>
            <p className="text-gray-500 max-w-sm">{t.noDataDesc}</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {categoryStats.map((cat, index) => {
                const meta = getCategoryMeta(cat.name);
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={cat.name} 
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 ${meta.color}`}>
                          <meta.icon size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                          <p className="text-xs text-gray-500">
                            {cat.count} {cat.count === 1 ? t.record : t.records}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatMoneySafe(cat.total)}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {cat.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* ИСПРАВЛЕНИЕ: Прогресс-бар теперь красится в цвет своей категории */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${meta.bg}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}