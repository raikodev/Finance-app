import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Target, TrendingDown } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { getCategoryMeta } from '../utils/categories';
import { convertAmount } from '../utils/currency';
import toast from 'react-hot-toast';

// 1. ЛОКАЛИЗАЦИЯ (i18n)
const PAGE_CONTENT = {
  en: {
    title: 'Budgets',
    subtitle: 'Keep your spending under control.',
    btnCreate: 'Create Budget',
    totalBudget: 'Total Budgeted',
    totalSpent: 'Total Spent',
    left: 'left',
    spent: 'spent',
    over: 'Over'
  },
  ru: {
    title: 'Бюджеты',
    subtitle: 'Контролируйте свои расходы.',
    btnCreate: 'Создать бюджет',
    totalBudget: 'Общий бюджет',
    totalSpent: 'Потрачено всего',
    left: 'осталось',
    spent: 'потрачено',
    over: 'Превышен'
  },
  pl: {
    title: 'Budżety',
    subtitle: 'Kontroluj swoje wydatki.',
    btnCreate: 'Utwórz budżet',
    totalBudget: 'Całkowity budżet',
    totalSpent: 'Wydano łącznie',
    left: 'pozostało',
    spent: 'wydano',
    over: 'Przekroczono'
  }
};

// 2. ДИНАМИЧЕСКИЕ БЮДЖЕТЫ (Совпадают с мок-транзакциями в сторе)
const MOCK_BUDGETS = [
  { id: 'budget-1', category: 'Software', limit: 300 }, // Под AWS и Vercel
  { id: 'budget-2', category: 'Transport', limit: 200 }, // Под Uber
  { id: 'budget-3', category: 'Food', limit: 600 },
  { id: 'budget-4', category: 'Housing', limit: 1500 },
];

export default function BudgetsPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const { lang, currency } = useAppStore();
  const t = PAGE_CONTENT[lang];

  // 3. ЕДИНЫЙ ФОРМАТ ДЕНЕГ (Синхронизирован со всеми страницами)
  const formatMoneySafe = (amount: number, forcePositive = false) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      const value = forcePositive ? Math.abs(amount) : amount;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0, // Бюджеты обычно смотрят без копеек
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `${amount.toFixed(0)} ${currency}`;
    }
  };

  // 4. СВЕДЕНИЕ ПЛАНА (Бюджет) И ФАКТА (Транзакции)
  const budgetsWithStats = useMemo(() => {
    // Убрали жесткий фильтр только по "текущему месяцу", чтобы мок-данные всегда отображались.
    // В реальном приложении здесь был бы DatePicker (выбор месяца).
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');

    return MOCK_BUDGETS.map(budget => {
      // Считаем все траты по этой категории (budget.limit задан в текущей валюте,
      // поэтому траты в других валютах сначала переводим в неё же)
      const spent = expenseTransactions
        .filter(tx => tx.category === budget.category)
        .reduce((acc, tx) => acc + convertAmount(Math.abs(tx.amount), tx.currency, currency), 0);

      // Математика без ограничения 100% для прогресс-бара (чтобы показать перерасход)
      const rawPercentage = (spent / budget.limit) * 100;
      const displayPercentage = Math.min(rawPercentage, 100); // Для синей полоски
      const overPercentage = rawPercentage > 100 ? Math.min(rawPercentage - 100, 100) : 0; // Для красной полоски (overflow)
      
      const remaining = budget.limit - spent;
      const isOver = remaining < 0;

      let progressColor = 'bg-emerald-500';
      if (rawPercentage >= 75 && rawPercentage < 90) progressColor = 'bg-amber-500';
      if (rawPercentage >= 90) progressColor = 'bg-rose-500';

      return {
        ...budget,
        spent,
        remaining,
        rawPercentage,
        displayPercentage,
        overPercentage,
        isOver,
        progressColor
      };
    }).sort((a, b) => b.rawPercentage - a.rawPercentage); // Сортируем: сначала самые проблемные
  }, [transactions, currency]); // currency важна: от неё зависит конвертация spent

  // Общая статистика
  const summary = useMemo(() => {
    const totalLimit = budgetsWithStats.reduce((acc, b) => acc + b.limit, 0);
    const totalSpent = budgetsWithStats.reduce((acc, b) => acc + b.spent, 0);
    return { totalLimit, totalSpent };
  }, [budgetsWithStats]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 space-y-8">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <button 
          onClick={() => toast.success('Budget creation coming soon!')}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>{t.btnCreate}</span>
        </button>
      </div>

      {/* Обзор бюджета */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t.totalBudget}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatMoneySafe(summary.totalLimit)}
            </h3>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <Target size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t.totalSpent}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatMoneySafe(summary.totalSpent)}
            </h3>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Список бюджетов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {budgetsWithStats.map((budget, idx) => {
          const meta = getCategoryMeta(budget.category);
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={budget.id}
              className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 ${meta.color}`}>
                    <meta.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{budget.category}</h3>
                    <p className="text-xs text-gray-500">
                      {formatMoneySafe(budget.limit)} limit
                    </p>
                  </div>
                </div>
                {budget.isOver && (
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">
                    <AlertTriangle size={12} />
                    {t.over}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className={`text-lg font-bold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                      {formatMoneySafe(budget.spent)}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{t.spent}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {/* Теперь честный минус при перерасходе */}
                    <span className={`text-sm font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>
                      {budget.remaining < 0 ? '-' : ''}{formatMoneySafe(Math.abs(budget.remaining))}
                    </span>
                    <span className="text-xs text-gray-500">{t.left}</span>
                  </div>
                </div>

                {/* 5. УМНЫЙ ПРОГРЕСС-БАР (Показывает overflow) */}
                <div className="w-full h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative mt-3 flex">
                  {/* Основной бар (до 100%) */}
                  <div 
                    className={`h-full ${budget.progressColor} transition-all duration-1000`} 
                    style={{ width: `${budget.displayPercentage}%` }} 
                  />
                  {/* Бар перерасхода (красный, рисуется поверх, если превысили 100%) */}
                  {budget.isOver && (
                    <div 
                      className="absolute top-0 left-0 h-full bg-rose-600/50 transition-all duration-1000 animate-pulse" 
                      style={{ width: `${budget.overPercentage}%` }} 
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}