import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  PieChart, Plus, Coffee, Home, Car, MonitorPlay, 
  Code, ShoppingCart, Briefcase, Gift, Zap, HelpCircle 
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

// Маппинг иконок и цветов для категорий
const CATEGORY_META: Record<string, { icon: React.ComponentType<any>, color: string, bg: string }> = {
  'Food': { icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500' },
  'Housing': { icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-500' },
  'Transport': { icon: Car, color: 'text-blue-500', bg: 'bg-blue-500' },
  'Entertainment': { icon: MonitorPlay, color: 'text-purple-500', bg: 'bg-purple-500' },
  'Software': { icon: Code, color: 'text-gray-500', bg: 'bg-gray-500' },
  'Shopping': { icon: ShoppingCart, color: 'text-pink-500', bg: 'bg-pink-500' },
  'Freelance': { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  'Salary': { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  'Gift': { icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500' },
};

export default function CategoriesPage() {
  const { lang } = useAppStore();
  const t = APP_T[lang] || APP_T['en'];
  const transactions = useTransactionStore((state) => state.transactions);

  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');

  // Группируем транзакции по категориям
  const categoryStats = useMemo(() => {
    const filtered = transactions.filter(tx => tx.type === activeTab);
    const stats: Record<string, { total: number; count: number }> = {};
    let totalSum = 0;

    filtered.forEach(tx => {
      const amount = Math.abs(tx.amount);
      if (!stats[tx.category]) {
        stats[tx.category] = { total: 0, count: 0 };
      }
      stats[tx.category].total += amount;
      stats[tx.category].count += 1;
      totalSum += amount;
    });

    const result = Object.entries(stats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalSum > 0 ? (data.total / totalSum) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    return { items: result, totalSum };
  }, [transactions, activeTab]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-6 pb-10">
      
      {/* ШАПКА */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
            {t.menu?.cat || 'Categories'}
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            Manage and analyze your spending areas.
          </p>
        </div>
        
        <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060608] outline-none">
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Category</span>
        </button>
      </div>

      {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
      <div className="flex items-center p-1 bg-gray-200/50 dark:bg-[#121214]/50 border border-gray-200/50 dark:border-white/[0.05] rounded-xl backdrop-blur-sm w-max">
        <button
          onClick={() => setActiveTab('Expense')}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === 'Expense' 
              ? 'bg-white dark:bg-[#222226] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white border border-transparent'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('Income')}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === 'Income' 
              ? 'bg-white dark:bg-[#222226] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white border border-transparent'
          }`}
        >
          Income
        </button>
      </div>

      {/* СТАТИСТИКА ПО КАТЕГОРИЯМ */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryStats.items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
            <PieChart className="text-gray-300 dark:text-gray-600 mb-3" size={32} />
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">No data available</h3>
            <p className="text-[13px] text-gray-500 max-w-xs">You don't have any {activeTab.toLowerCase()} records yet.</p>
          </div>
        ) : (
          categoryStats.items.map((cat) => {
            const meta = CATEGORY_META[cat.name] || { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-500' };
            const Icon = meta.icon;

            return (
              <motion.div key={cat.name} variants={itemVariants} className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 ${meta.color} transition-colors group-hover:scale-110 duration-300`}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[12px] font-medium text-gray-500">
                        {cat.count} {cat.count === 1 ? 'record' : 'records'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-bold tabular-nums tracking-tight ${activeTab === 'Expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatMoney(cat.total)}
                    </p>
                    <p className="text-[12px] font-medium text-gray-500 mt-0.5">
                      {cat.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Прогресс-бар */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-[#1a1a1c] rounded-full overflow-hidden relative z-10">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${cat.percentage}%` }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${meta.bg}`}
                  />
                </div>
                
                {/* Фоновое свечение (видно только в темной теме) */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${meta.bg} opacity-0 dark:opacity-5 blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-10`} />
              </motion.div>
            );
          })
        )}
      </motion.div>

    </div>
  );
}