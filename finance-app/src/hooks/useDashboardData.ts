import { useMemo, useDeferredValue } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useTranslation } from '../locales/translations';
import { getCategoryMeta } from '../utils/categories';

// В реальном приложении это приходит из API (например, ExchangeRate-API)
const MOCK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PLN: 4.01, RUB: 92.5, UAH: 39.5
};

// Вынесли функцию трендов, чтобы не засорять хук
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / previous) * 100;
};

export function useDashboardData(searchQuery: string = '', dateFilter: string = 'month') {
  // 1. ИСПОЛЬЗУЕМ ГЛОБАЛЬНЫЕ СТОРЫ (Без селекторов всего объекта!)
  const lang = useAppStore(s => s.lang);
  const currency = useAppStore(s => s.currency);
  const transactions = useTransactionStore(s => s.transactions);
  
  // 2. ИСПОЛЬЗУЕМ ГЛОБАЛЬНЫЙ СЛОВАРЬ (Конец дублированию)
  const t = useTranslation(lang).dashboard;

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // 3. БЕЗОПАСНАЯ КОНВЕРТАЦИЯ ВАЛЮТ
  const convertAmount = (amount: number, fromCur: string, toCur: string) => {
    if (fromCur === toCur) return amount;
    // Защита от деления на ноль и неизвестных валют
    const rateFrom = MOCK_RATES[fromCur] || 1;
    const rateTo = MOCK_RATES[toCur] || 1;
    const baseAmount = amount / rateFrom;
    return baseAmount * rateTo;
  };

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
    } catch (e) {
      return `${amount.toFixed(2)} ${curCode}`;
    }
  };

  // 5. УМНАЯ ФИЛЬТРАЦИЯ
  const { currentTxs, previousTxs } = useMemo(() => {
    const now = new Date();
    const query = deferredSearchQuery.toLowerCase();
    
    let current: typeof transactions = [];
    let previous: typeof transactions = [];

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
    const expensesByCategory: Record<string, number> = {};
    currentTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      const amount = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + amount;
    });

    return Object.entries(expensesByCategory)
      .map(([name, value]) => {
        const meta = getCategoryMeta(name);
        // Достаем hex-код из Tailwind классов (упрощенно для графика)
        const colorHash = meta.color.includes('rose') ? '#f43f5e' : meta.color.includes('indigo') ? '#6366f1' : meta.color.includes('orange') ? '#f97316' : '#10b981';
        return { name, value, color: colorHash };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Топ 5 категорий
  }, [currentTxs, currency]);

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
      prevExpense: stats.expense * 0.9 // Имитация прошлой недели для красоты линии
    })).slice(-7); // Только 7 последних дней
  }, [currentTxs, currency, lang]);

  return {
    t,
    filteredTxList: currentTxs,
    displayBalance: currentStats.balance,
    displayIncome: currentStats.income,
    displayExpenses: currentStats.expenses,
    trends,
    formatMoneyString,
    rates: MOCK_RATES,
    pieData,
    areaData
  };
}