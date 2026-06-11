import { useState, useMemo } from 'react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';

export interface AIInsightData {
  insight: string;
  percentage: number;
  anomaly: string;
  action: string;
}

// Утилита для расчета процента роста/падения
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : current < 0 ? -100 : 0;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Number(change.toFixed(1));
};

// Заглушка курсов валют (в реальном приложении получаем по API)
const MOCK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PLN: 4.01, UAH: 39.5, CZK: 23.4, CHF: 0.91, JPY: 151.2, AUD: 1.53, CAD: 1.36
};

// Заглушка локализации
const TRANSLATIONS: Record<string, any> = {
  en: { 
    welcome: 'Welcome back', subtitle: 'Here is your financial overview.',
    totalBalance: 'Total Balance', totalIncome: 'Total Income', totalExpenses: 'Total Expenses',
    addRecord: 'Add Record', search: 'Search transactions...',
    allTime: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom Range',
    spendingOverview: 'Spending Overview', incomeType: 'Income', expenseType: 'Expense'
  },
  ru: { 
    welcome: 'С возвращением', subtitle: 'Ваша финансовая сводка.',
    totalBalance: 'Общий баланс', totalIncome: 'Все доходы', totalExpenses: 'Все расходы',
    addRecord: 'Добавить запись', search: 'Поиск транзакций...',
    allTime: 'За все время', today: 'Сегодня', week: 'Эта неделя', month: 'Этот месяц', custom: 'Свой период',
    spendingOverview: 'Обзор расходов', incomeType: 'Доходы', expenseType: 'Расходы'
  }
};

export function useDashboardData() {
  const appStore = useAppStore();
  const lang = appStore.lang || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);

  const [currency, setCurrency] = useState('USD');
  const [dateFilter, setDateFilter] = useState<'allTime'|'today'|'week'|'month'|'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const convertAmount = (amount: number, fromCur: string, toCur: string) => {
    if (fromCur === toCur) return amount;
    const baseAmount = amount / (MOCK_RATES[fromCur] || 1);
    return baseAmount * (MOCK_RATES[toCur] || 1);
  };

  const formatMoneyString = (amount: number, curCode: string) => {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency', currency: curCode, minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(amount);
  };

  // 1. ФИЛЬТРАЦИЯ ТЕКУЩЕГО ПЕРИОДА
  const filteredTxList = useMemo(() => {
    let filtered = transactions;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(lowerQuery) || tx.category.toLowerCase().includes(lowerQuery)
      );
    }
    
    const now = new Date();
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      if (dateFilter === 'today') return txDate.toDateString() === now.toDateString();
      if (dateFilter === 'week') {
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
        return txDate >= startOfWeek;
      }
      if (dateFilter === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      
      // ИСПРАВЛЕНИЕ: Точные границы дня для Custom Range
      if (dateFilter === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0); // Начало дня (00:00:00)
        
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999); // Конец дня (23:59:59)
        
        return txDate.getTime() >= start.getTime() && txDate.getTime() <= end.getTime();
      }
      return true;
    });
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, customStartDate, customEndDate, searchQuery]);

  // 2. ФИЛЬТРАЦИЯ ПРЕДЫДУЩЕГО ПЕРИОДА (ДЛЯ ПРОЦЕНТОВ)
  const prevFilteredTxList = useMemo(() => {
    let filtered = transactions;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(lowerQuery) || tx.category.toLowerCase().includes(lowerQuery)
      );
    }

    const now = new Date();
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      
      if (dateFilter === 'today') {
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        return txDate.toDateString() === yesterday.toDateString();
      }
      
      if (dateFilter === 'week') {
        const startOfThisWeek = new Date(now); startOfThisWeek.setDate(now.getDate() - now.getDay());
        const startOfLastWeek = new Date(startOfThisWeek); startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        return txDate >= startOfLastWeek && txDate < startOfThisWeek;
      }
      
      if (dateFilter === 'month') {
        let prevMonth = now.getMonth() - 1;
        let prevYear = now.getFullYear();
        if (prevMonth < 0) { prevMonth = 11; prevYear -= 1; }
        return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear;
      }
      
      if (dateFilter === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diffTime);
        return txDate >= prevStart && txDate <= prevEnd;
      }
      
      return false; // Для 'allTime' нет предыдущего периода
    });

    return filtered;
  }, [transactions, dateFilter, customStartDate, customEndDate, searchQuery]);

  // 3. ПОДСЧЕТ СУММ ТЕКУЩЕГО ПЕРИОДА
  const { displayIncome, displayExpenses, displayBalance } = useMemo(() => {
    let income = 0; let expense = 0;
    filteredTxList.forEach(tx => {
      const converted = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      if (tx.type === 'Income') income += converted; else expense += converted;
    });
    return { displayIncome: income, displayExpenses: expense, displayBalance: income - expense };
  }, [filteredTxList, currency]);

  // 4. ПОДСЧЕТ ТРЕНДОВ ПРОТИВ ПРОШЛОГО ПЕРИОДА
  const trends = useMemo(() => {
    let prevIncome = 0; let prevExpense = 0;
    prevFilteredTxList.forEach(tx => {
      const converted = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      if (tx.type === 'Income') prevIncome += converted; else prevExpense += converted;
    });
    const prevBalance = prevIncome - prevExpense;

    return {
      balance: calculateTrend(displayBalance, prevBalance),
      income: calculateTrend(displayIncome, prevIncome),
      expenses: calculateTrend(displayExpenses, prevExpense),
      records: calculateTrend(filteredTxList.length, prevFilteredTxList.length)
    };
  }, [prevFilteredTxList, displayBalance, displayIncome, displayExpenses, filteredTxList.length, currency]);

  // 5. ДАННЫЕ ДЛЯ ГРАФИКОВ
  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b']; 
    filteredTxList.filter(tx => tx.type === 'Expense').forEach(tx => {
      const val = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      categories[tx.category] = (categories[tx.category] || 0) + val;
    });
    return Object.entries(categories).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })).sort((a, b) => b.value - a.value);
  }, [filteredTxList, currency]);

  const areaData = useMemo(() => {
    return [
      { date: '1 May', income: 400, expense: 240, prevExpense: 200 },
      { date: '5 May', income: 300, expense: 139, prevExpense: 221 },
      { date: '10 May', income: 200, expense: 980, prevExpense: 229 },
      { date: '15 May', income: 2780, expense: 390, prevExpense: 200 },
      { date: '20 May', income: 1890, expense: 480, prevExpense: 218 },
      { date: '25 May', income: 2390, expense: 380, prevExpense: 250 },
    ];
  }, [filteredTxList]);

  // 6. ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ
  const aiData: AIInsightData = useMemo(() => {
    if (displayExpenses === 0) {
      return { insight: "Not enough data to analyze spending patterns yet.", percentage: 0, anomaly: "Awaiting Data", action: "Add Record" };
    }
    if (pieData.length > 0) {
      const topCategory = pieData[0];
      const percentage = Math.round((topCategory.value / displayExpenses) * 100);
      if (percentage > 40) {
        return { insight: `Your spending on ${topCategory.name} represents ${percentage}% of your total expenses.`, percentage: -12, anomaly: 'High Concentration', action: `Review ${topCategory.name}` };
      }
    }
    return { insight: 'Your cashflow is stable. Expense distribution is balanced across all major categories.', percentage: +5, anomaly: 'Stable Metrics', action: 'View Forecast' };
  }, [displayExpenses, pieData]);

  return {
    currency, setCurrency, 
    lang, setLang: appStore.setLang || (() => {}), 
    t, rates: MOCK_RATES,
    dateFilter, setDateFilter, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    searchQuery, setSearchQuery,
    filteredTxList, displayIncome, displayExpenses, displayBalance,
    trends, // <-- ДОБАВЛЕНЫ ТРЕНДЫ В ЭКСПОРТ
    pieData, areaData, aiData,
    formatMoneyString, addTransaction, deleteTransaction
  };
}