import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, PiggyBank, Target, BarChart3 } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { convertAmount as sharedConvertAmount } from '../utils/currency';
import { useExchangeRatesStore } from '../store/useExchangeRatesStore';
import toast from 'react-hot-toast';

// Полные строки классов — Tailwind не умеет резолвить bg-${color}-50 в рантайме,
// ему нужны готовые литералы прямо в исходниках, иначе класс не попадёт в сборку
const KPI_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
};

export default function ReportsPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const liveRates = useExchangeRatesStore(s => s.rates);
  const { lang, currency } = useAppStore();
  const convertAmount = useCallback(
    (amount: number, fromCur: string, toCur: string) =>
      sharedConvertAmount(amount, fromCur, toCur, liveRates),
    [liveRates]
  );
  const { t } = useTranslation();

  // 1. УМНОЕ ФОРМАТИРОВАНИЕ ДЕНЕГ (С поддержкой локалей и честного минуса)
  const formatMoneySafe = (amount: number, forcePositive = false) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      const valueToFormat = forcePositive ? Math.abs(amount) : amount;
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(valueToFormat);
    } catch {
      return `${amount.toFixed(0)} ${currency}`;
    }
  };

  // 2. РАЗДЕЛЕНИЕ ВЫЧИСЛЕНИЙ (Оптимизация рендеров)
  // Шаг А: Считаем сырые данные графика за 6 месяцев
  const rawChartData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      
      // Фильтруем транзакции строго за этот месяц
      const monthTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === d.getFullYear() && txDate.getMonth() === d.getMonth();
      });

      // Считаем доходы и расходы (используем строчные 'income'/'expense' из нового стора)
      // и переводим каждую транзакцию в текущую валюту перед суммированием
      const income = monthTxs.filter(t => t.type === 'income')
        .reduce((acc, t) => acc + convertAmount(Math.abs(t.amount), t.currency, currency), 0);
      const expense = monthTxs.filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + convertAmount(Math.abs(t.amount), t.currency, currency), 0);

      data.push({ date: d, monthKey, income, expense });
    }
    return data;
  }, [transactions, currency, convertAmount]); // currency и convertAmount важны для конвертации

  // Шаг Б: Локализуем метки для графика
  const chartData = useMemo(() => {
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
    return rawChartData.map(d => ({
      ...d,
      label: d.date.toLocaleDateString(locale, { month: 'short' })
    }));
  }, [rawChartData, lang]);

  // 3. ГЛОБАЛЬНАЯ АНАЛИТИКА (За все время)
  const globalStats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income')
      .reduce((acc, t) => acc + convertAmount(Math.abs(t.amount), t.currency, currency), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + convertAmount(Math.abs(t.amount), t.currency, currency), 0);
    
    const net = totalIncome - totalExpense;
    // Корректный Savings Rate (защита от деления на ноль)
    const savingsRate = totalIncome > 0 ? ((net) / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, net, savingsRate };
    }, [transactions, currency, convertAmount]);

  // 4. ДИНАМИЧЕСКАЯ ШКАЛА Y (Защита от Infinity)
  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...chartData.map(m => Math.max(m.income, m.expense)));
    return maxVal > 0 ? maxVal : 1; // Защита от деления на 0, если данных нет
  }, [chartData]);

  // Линии сетки графика (от максимума к нулю)
  const gridLines = [maxChartValue, maxChartValue * 0.66, maxChartValue * 0.33, 0];

  // 5. РЕАЛЬНЫЙ ЭКСПОРТ (Используем нативную печать браузера для "PDF")
  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast.error(t('reports.noDataToExport'));
      return;
    }
    toast.success(t('reports.preparingPdf'));
    setTimeout(() => window.print(), 500); 
  };

  // 6. СОСТОЯНИЕ БЕЗ ДАННЫХ
  if (transactions.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto pb-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('reports.noDataTitle')}</h2>
        <p className="text-gray-500 max-w-md">{t('reports.noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div data-print-report className="w-full max-w-5xl mx-auto pb-10 space-y-8">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
          <p className="text-gray-500 text-sm">{t('reports.subtitle')}</p>
        </div>
        <button 
          data-print-hide
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
        >
          <Download size={16} />
          <span>{t('reports.exportPdf')}</span>
        </button>
      </div>

      {/* Карточки KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'income', label: t('reports.totalIncome'), value: formatMoneySafe(globalStats.totalIncome, true), icon: TrendingUp, color: 'emerald' },
          { key: 'expenses', label: t('reports.totalExpenses'), value: formatMoneySafe(globalStats.totalExpense, true), icon: TrendingDown, color: 'rose' },
          // ЗДЕСЬ ИСПРАВЛЕН БАГ УБЫТКА: net может быть с минусом, и мы его не скрываем!
          { key: 'net', label: t('reports.netSavings'), value: formatMoneySafe(globalStats.net), icon: PiggyBank, color: globalStats.net >= 0 ? 'indigo' : 'rose' },
          { key: 'rate', label: t('reports.savingsRate'), value: `${globalStats.savingsRate.toFixed(1)}%`, icon: Target, color: 'blue' }
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.key}
            className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className={`text-2xl font-bold mt-1 ${stat.color === 'rose' && stat.key === 'net' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                  {stat.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${KPI_COLOR_MAP[stat.color]}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* График Cash Flow */}
      <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('reports.cashFlowTitle')}</h3>
        
        <div className="relative h-64 mt-4 flex items-end gap-2 sm:gap-6 pt-4 pr-2">
          
          {/* ИСПРАВЛЕНИЕ: Ось Y со значениями */}
          <div className="absolute left-0 top-0 bottom-6 w-12 sm:w-16 flex flex-col justify-between text-[10px] sm:text-xs text-gray-400 font-medium">
            {gridLines.map((val, i) => (
              <span key={i} className="bg-white dark:bg-[#121214] pr-2 z-10 -mt-2">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
              </span>
            ))}
          </div>

          {/* ИСПРАВЛЕНИЕ: Сетка графика теперь привязана к оси Y */}
          <div className="absolute left-10 sm:left-14 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
            {gridLines.map((_, i) => (
              <div key={i} className="w-full h-px bg-gray-100 dark:bg-white/5 border-dashed"></div>
            ))}
          </div>

          {/* Столбики */}
          <div className="flex-1 flex justify-between h-full pl-10 sm:pl-16 relative z-10 pb-6">
            {chartData.map((month) => {
              const incomeHeight = (month.income / maxChartValue) * 100;
              const expenseHeight = (month.expense / maxChartValue) * 100;

              return (
                <div key={month.monthKey} className="flex flex-col justify-end items-center w-full group relative h-full">
                  
                  {/* Tooltips */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-lg">
                    <span className="text-emerald-400 dark:text-emerald-600">+{formatMoneySafe(month.income, true)}</span>
                    <span className="mx-1">/</span>
                    <span className="text-rose-400 dark:text-rose-600">-{formatMoneySafe(month.expense, true)}</span>
                  </div>

                  {/* Оптимизированные бары */}
                  <div className="flex gap-1 w-full max-w-[40px] items-end h-full">
                    <motion.div 
                      layoutId={`income-${month.monthKey}`}
                      initial={{ height: 0 }} 
                      animate={{ height: `${incomeHeight}%` }} 
                      transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                      className="w-1/2 bg-emerald-500 rounded-t-md opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <motion.div 
                      layoutId={`expense-${month.monthKey}`}
                      initial={{ height: 0 }} 
                      animate={{ height: `${expenseHeight}%` }} 
                      transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                      className="w-1/2 bg-rose-500 rounded-t-md opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  {/* Подписи оси X */}
                  <span className="absolute -bottom-6 text-xs font-medium text-gray-500 capitalize">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Легенда */}
        <div className="flex justify-center gap-6 mt-8 border-t border-gray-100 dark:border-white/5 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.income')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.expense')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}