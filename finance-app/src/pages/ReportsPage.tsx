import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  BarChart3, Download, TrendingUp, TrendingDown, 
  Wallet, PieChart 
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

export default function ReportsPage() {
  const { lang } = useAppStore();
  const t = APP_T[lang] || APP_T['en'];
  const transactions = useTransactionStore((state) => state.transactions);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  // Вычисляем данные за последние 6 месяцев
  const monthlyData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      });

      const income = monthTxs.filter(t => t.type === 'Income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expense = monthTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      result.push({ label: monthLabel, income, expense });
    }
    return result;
  }, [transactions, lang]);

  // Глобальные метрики за всё время
  const globalStats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, net, savingsRate };
  }, [transactions]);

  // Максимальное значение для масштабирования графика
  const maxChartValue = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense, 1))); // 1 чтобы избежать деления на 0

  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-6 pb-10">
      
      {/* ШАПКА */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
            {t.menu?.rep || 'Reports'}
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            Deep dive into your financial performance.
          </p>
        </div>
        
        <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <Download size={14} />
          <span>Export PDF</span>
        </button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
        
        {/* КЛЮЧЕВЫЕ МЕТРИКИ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Income', value: formatMoney(globalStats.totalIncome), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Total Expenses', value: formatMoney(globalStats.totalExpense), icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Net Savings', value: formatMoney(globalStats.net), icon: Wallet, color: globalStats.net >= 0 ? 'text-indigo-500' : 'text-rose-500', bg: globalStats.net >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10' },
            { label: 'Savings Rate', value: `${globalStats.savingsRate.toFixed(1)}%`, icon: PieChart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants} className="bg-white dark:bg-[#121214] p-5 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={16} strokeWidth={2.5} />
                </div>
                <p className="text-[13px] font-semibold text-gray-500">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${stat.label === 'Total Expenses' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ГРАФИК ЗА 6 МЕСЯЦЕВ */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] p-6 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" /> Cash Flow (Last 6 Months)
            </h3>
            <div className="flex items-center gap-4 text-[12px] font-medium text-gray-500">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> Income</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500"></div> Expense</div>
            </div>
          </div>

          {/* Сам CSS-график */}
          <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-6 pt-4 border-b border-gray-100 dark:border-white/10 relative">
            
            {/* Линии сетки */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-full h-px bg-gray-100 dark:bg-white/[0.03] last:bg-transparent"></div>
              ))}
            </div>

            {monthlyData.map((month, idx) => {
              const incomeHeight = (month.income / maxChartValue) * 100;
              const expenseHeight = (month.expense / maxChartValue) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                  
                  {/* Столбики */}
                  <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-52">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${incomeHeight}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="w-1/2 bg-emerald-500 rounded-t-md relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {formatMoney(month.income)}
                      </div>
                    </motion.div>
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${expenseHeight}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="w-1/2 bg-rose-500 rounded-t-md relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {formatMoney(month.expense)}
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Месяц */}
                  <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}