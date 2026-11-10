import { useMemo, useDeferredValue, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { getCategoryMetaFromSnapshot } from '../utils/categories';
import { convertAmount as sharedConvertAmount } from '../utils/currency';
import { useExchangeRatesStore } from '../store/useExchangeRatesStore';
import { calculateTrend as calculateTrendResult } from '../utils/math';

// Форма объекта, которую ждут StatsGrid/ChartsSection (доступ через t.xxx,
// а не через функцию t('key') — так исторически сложилось, и переписывать
// оба компонента ради смены i18n-движка не было смысла)
export interface DashboardTranslations {
  welcome: string;
  subtitle: string;
  baseCurrency: string;
  addTransaction: string;
  totalBalance: string;
  totalIncome: string;
  totalExpenses: string;
  records: string;
  vsLastPeriod: string;
  spendingOverview: string;
  total: string;
  cashFlow: string;
  income: string;
  expenses: string;
  noData: string;
  ratesError: string;
  ratesRetry: string;
}

// Тонкая обёртка вокруг общей calculateTrend (utils/math.ts): здесь нужен просто
// процент числом для StatCard, а не весь TrendResult — семантику "хорошо/плохо"
// (рост расходов = плохо) StatCard уже сам решает через проп inverseTrend.
const calculateTrend = (current: number, previous: number): number => {
  const result = calculateTrendResult(current, previous);
  return result.value ?? (result.direction === 'up' ? 100 : result.direction === 'down' ? -100 : 0);
};

export function useDashboardData(searchQuery: string = '', dateFilter: string = 'month') {
  // 1. ИСПОЛЬЗУЕМ ГЛОБАЛЬНЫЕ СТОРЫ (Без селекторов всего объекта!)
  const lang = useAppStore(s => s.lang); // Нужен для Intl/toLocaleDateString ниже, не для переводов
  const currency = useAppStore(s => s.currency);
  const liveRates = useExchangeRatesStore(s => s.rates); // Живые курсы вместо статичного MOCK_RATES
  const transactions = useTransactionStore(s => s.transactions);
  
  // 2. i18next — собираем объект нужной формы для StatsGrid/ChartsSection
  const { t: translate } = useTranslation();
  const t: DashboardTranslations = useMemo(() => ({
    welcome: translate('dashboard.welcome'),
    subtitle: translate('dashboard.subtitle'),
    baseCurrency: translate('dashboard.baseCurrency'),
    addTransaction: translate('dashboard.addTransaction'),
    totalBalance: translate('dashboard.totalBalance'),
    totalIncome: translate('dashboard.totalIncome'),
    totalExpenses: translate('dashboard.totalExpenses'),
    records: translate('dashboard.records'),
    vsLastPeriod: translate('dashboard.vsLastPeriod'),
    spendingOverview: translate('dashboard.spendingOverview'),
    total: translate('dashboard.total'),
    cashFlow: translate('dashboard.cashFlow'),
    income: translate('dashboard.income'),
    expenses: translate('dashboard.expenses'),
    noData: translate('dashboard.noData'),
    ratesError: translate('dashboard.ratesError'),
    ratesRetry: translate('dashboard.ratesRetry'),
  }), [translate]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // 3. БЕЗОПАСНАЯ КОНВЕРТАЦИЯ ВАЛЮТ (общая функция из utils/currency.ts).
  // useCallback, чтобы ссылка была стабильной и её можно было указывать
  // в зависимостях useMemo без лишних пересчётов.
  const convertAmount = useCallback(
    (amount: number, fromCur: string, toCur: string) =>
      sharedConvertAmount(amount, fromCur, toCur, liveRates),
    [liveRates]
  );

  // 4. БЕЗОПАСНОЕ ФОРМАТИРОВАНИЕ ДЕНЕГ
  const formatMoneyString = (amount: number, curCode: string) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${curCode}`;
    }
  };

  // 5. УМНАЯ ФИЛЬТРАЦИЯ
  const { currentTxs, previousTxs } = useMemo(() => {
    const now = new Date();
    const query = deferredSearchQuery.toLowerCase();
    
    const current: typeof transactions = [];
    const previous: typeof transactions = [];

    // Фильтр по поиску (общий для всех дат)
    const baseFiltered = transactions.filter(tx => 
      (!query || tx.description.toLowerCase().includes(query) || tx.category.toLowerCase().includes(query))
    );

    baseFiltered.forEach(tx => {
      const txDate = new Date(tx.date);
      let isCurrent = false;
      let isPrev = false;

      // Логика окон времени
      if (dateFilter === 'allTime') {
        isCurrent = true; // Для allTime предыдущего периода нет
      } else if (dateFilter === 'today') {
        isCurrent = txDate.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        isPrev = txDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        isCurrent = txDate >= weekAgo;
        isPrev = txDate >= twoWeeksAgo && txDate < weekAgo;
      } else if (dateFilter === 'month') {
        isCurrent = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        let prevMonth = now.getMonth() - 1;
        let prevYear = now.getFullYear();
        if (prevMonth < 0) { prevMonth = 11; prevYear--; }
        isPrev = txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear;
      }

      if (isCurrent) current.push(tx);
      if (isPrev) previous.push(tx);
    });

    // Сортировка только текущего массива
    current.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { currentTxs: current, previousTxs: previous };
  }, [transactions, deferredSearchQuery, dateFilter]);

  // 6. РАСЧЕТ БАЛАНСОВ
  const calculateStats = (txList: typeof transactions) => {
    let income = 0;
    let expenses = 0;
    txList.forEach(tx => {
      const amountInBase = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      if (tx.type === 'income') income += amountInBase;
      if (tx.type === 'expense') expenses += amountInBase;
    });
    return { income, expenses, balance: income - expenses };
  };

  const currentStats = calculateStats(currentTxs);
  const previousStats = calculateStats(previousTxs);

  // 7. ЧЕСТНЫЕ ТРЕНДЫ (Без +100% для allTime)
  const trends = useMemo(() => {
    if (dateFilter === 'allTime' || previousTxs.length === 0) {
      return { balance: 0, income: 0, expenses: 0, records: 0 }; // Нет смысла считать тренд, если не с чем сравнивать
    }
    return {
      balance: calculateTrend(currentStats.balance, previousStats.balance),
      income: calculateTrend(currentStats.income, previousStats.income),
      expenses: calculateTrend(currentStats.expenses, previousStats.expenses),
      records: calculateTrend(currentTxs.length, previousTxs.length),
    };
  }, [currentStats, previousStats, currentTxs.length, previousTxs.length, dateFilter]);

  // 8. ДАННЫЕ ДЛЯ PIE CHART (Интеграция с нашими едиными цветами категорий)
  const pieData = useMemo(() => {
    interface CategoryTotals {
      value: number;
      categoryColor?: string;
      categoryIcon?: string;
    }

    const expensesByCategory: Record<string, CategoryTotals> = {};
    currentTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      const amount = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      const totals = expensesByCategory[tx.category] ?? { value: 0 };
      totals.value += amount;
      // Запоминаем снапшот первого расхода в категории: если категорию
      // удалят, график сохранит её цвет, а не станет серым.
      if (!totals.categoryColor && tx.categoryColor) totals.categoryColor = tx.categoryColor;
      if (!totals.categoryIcon && tx.categoryIcon) totals.categoryIcon = tx.categoryIcon;
      expensesByCategory[tx.category] = totals;
    });

    return Object.entries(expensesByCategory)
      .map(([name, totals]) => {
        const meta = getCategoryMetaFromSnapshot(name, totals);
        // Достаем hex-код из Tailwind классов (упрощенно для графика)
        return { name, value: totals.value, color: meta.hex };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Топ 5 категорий
  }, [currentTxs, currency, convertAmount]);

  // 9. РЕАЛЬНЫЕ ДАННЫЕ ДЛЯ AREA CHART (График за последние 7 дней)
  const areaData = useMemo(() => {
    if (currentTxs.length === 0) return [];
    
    // Группируем по дням
    const dailyData: Record<string, { income: number, expense: number }> = {};
    
    // Берем последние 7 дней (или доступные)
    const sortedDates = [...currentTxs].reverse(); // Хронологический порядок
    
    sortedDates.forEach(tx => {
      const dateStr = new Date(tx.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
      if (!dailyData[dateStr]) dailyData[dateStr] = { income: 0, expense: 0 };
      
      const amount = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      if (tx.type === 'income') dailyData[dateStr].income += amount;
      if (tx.type === 'expense') dailyData[dateStr].expense += amount;
    });

    return Object.entries(dailyData).map(([date, stats]) => ({
      date,
      income: stats.income,
      expense: stats.expense,
    })).slice(-7); // Только 7 последних дней
  }, [currentTxs, currency, lang, convertAmount]);

  return {
    t,
    filteredTxList: currentTxs,
    displayBalance: currentStats.balance,
    displayIncome: currentStats.income,
    displayExpenses: currentStats.expenses,
    trends,
    formatMoneyString,
    rates: liveRates,
    pieData,
    areaData
  };
}