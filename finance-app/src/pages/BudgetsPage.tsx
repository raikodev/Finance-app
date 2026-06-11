import React, { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Wallet, Plus, Coffee, Home, Car, MonitorPlay, 
  ShoppingCart, AlertTriangle 
} from 'lucide-react';

import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { APP_T } from '../locales/translations';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

// Заглушка для лимитов (В реальном проекте это хранилось бы в Zustand/БД)
const MOCK_BUDGETS = [
  { id: '1', category: 'Food', limit: 600 },
  { id: '2', category: 'Housing', limit: 1500 },
  { id: '3', category: 'Transport', limit: 200 },
  { id: '4', category: 'Entertainment', limit: 150 },
  { id: '5', category: 'Shopping', limit: 300 },
];

const CATEGORY_META: Record<string, { icon: React.ComponentType<any>, color: string }> = {
  'Food': { icon: Coffee, color: 'text-amber-500' },
  'Housing': { icon: Home, color: 'text-indigo-500' },
  'Transport': { icon: Car, color: 'text-blue-500' },
  'Entertainment': { icon: MonitorPlay, color: 'text-purple-500' },
  'Shopping': { icon: ShoppingCart, color: 'text-pink-500' },
};

export default function BudgetsPage() {
  const { lang } = useAppStore();
  const t = APP_T[lang] || APP_T['en'];
  const transactions = useTransactionStore((state) => state.transactions);

  // Считаем, сколько реально потрачено по каждой категории в этом месяце
  const budgetsWithStats = useMemo(() => {
    const now = new Date();
    
    // Фильтруем только расходы за текущий месяц
    const currentMonthExpenses = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === 'Expense' && 
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    });

    return MOCK_BUDGETS.map(budget => {
      const spent = currentMonthExpenses
        .filter(tx => tx.category === budget.category)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      const percentage = Math.min((spent / budget.limit) * 100, 100);
      const remaining = budget.limit - spent;
      const isOver = remaining < 0;

      // Логика цветов прогресс-бара
      let progressColor = 'bg-emerald-500'; // Все отлично (< 75%)
      if (percentage >= 75 && percentage < 90) progressColor = 'bg-amber-500'; // Внимание (75-90%)
      if (percentage >= 90) progressColor = 'bg-rose-500'; // Тревога (> 90%)

      return { ...budget, spent, percentage, remaining, isOver, progressColor };
    }).sort((a, b) => b.percentage - a.percentage); // Сортируем: сначала те, где лимит исчерпан
  }, [transactions]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const totalBudget = budgetsWithStats.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgetsWithStats.reduce((acc, b) => acc + b.spent, 0);

  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-6 pb-10">
      
      {/* ШАПКА */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
            {t.menu?.bud || 'Budgets'}
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            Keep your spending under control.
          </p>
        </div>
        
        <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060608] outline-none">
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Budget</span>
        </button>
      </div>

      {/* ОБЩАЯ СВОДКА */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
          <p className="text-[13px] font-semibold text-gray-500 mb-1">Total Budgeted</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(totalBudget)}</p>
        </div>
        <div className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
          <p className="text-[13px] font-semibold text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(totalSpent)}</p>
        </div>
        <div className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
          <p className="text-[13px] font-semibold text-gray-500 mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatMoney(totalBudget - totalSpent)}
          </p>
        </div>
      </div>

      {/* КАРТОЧКИ БЮДЖЕТОВ */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetsWithStats.map((budget) => {
          const meta = CATEGORY_META[budget.category] || { icon: Wallet, color: 'text-gray-500' };
          const Icon = meta.icon;

          return (
            <motion.div key={budget.id} variants={itemVariants} className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 ${meta.color}`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
                      {budget.category}
                    </h3>
                    <p className="text-[12px] font-medium text-gray-500 mt-0.5">
                      {formatMoney(budget.spent)} of {formatMoney(budget.limit)}
                    </p>
                  </div>
                </div>
                
                {budget.isOver && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    <AlertTriangle size={12} /> Over
                  </div>
                )}
              </div>

              {/* Индикатор */}
              <div className="w-full h-2 bg-gray-100 dark:bg-[#1a1a1c] rounded-full overflow-hidden mb-3">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${budget.percentage}%` }} 
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${budget.progressColor}`}
                />
              </div>

              <div className="flex items-center justify-between text-[12px] font-semibold">
                <span className="text-gray-500">{budget.percentage.toFixed(1)}% spent</span>
                <span className={budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-gray-300'}>
                  {budget.isOver ? `-${formatMoney(Math.abs(budget.remaining))}` : `${formatMoney(budget.remaining)} left`}
                </span>
              </div>

            </motion.div>
          );
        })}
      </motion.div>

    </div>
  );
}