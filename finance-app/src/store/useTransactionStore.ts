import { create } from 'zustand';

// 1. СТРОГИЕ ТИПЫ
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;          // Строго ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
  amount: number;        // ВСЕГДА ПОЛОЖИТЕЛЬНОЕ ЧИСЛО (> 0)
  type: TransactionType;
  category: string;
  description: string;
  currency: string;
}

interface TransactionState {
  // Данные
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Экшены (Методы) возвращают boolean, чтобы UI знал, прошла ли операция
  addTransaction: (txData: Omit<Transaction, 'id'>) => string; // Возвращает ID новой транзакции
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => boolean;
  deleteTransaction: (id: string) => boolean;
  
  // Заготовка для реального бекенда
  fetchTransactions: () => Promise<void>;
}

// 2. АДЕКВАТНЫЕ МОК-ДАННЫЕ
// Реалистичные категории и суммы. Amounts строго положительные!
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: crypto.randomUUID(), date: new Date().toISOString(), amount: 3200.00, type: 'income', category: 'Freelance', description: 'Stripe Payout', currency: 'USD' },
  { id: crypto.randomUUID(), date: new Date(Date.now() - 86400000).toISOString(), amount: 142.50, type: 'expense', category: 'Software', description: 'AWS Cloud Services', currency: 'USD' },
  { id: crypto.randomUUID(), date: new Date(Date.now() - 172800000).toISOString(), amount: 20.00, type: 'expense', category: 'Software', description: 'Vercel Pro', currency: 'USD' },
  { id: crypto.randomUUID(), date: new Date(Date.now() - 259200000).toISOString(), amount: 45.00, type: 'expense', category: 'Transport', description: 'Uber Rides', currency: 'USD' },
];

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: INITIAL_TRANSACTIONS,
  isLoading: false,
  error: null,

  addTransaction: (txData) => {
    // 3. БЕЗОПАСНАЯ ГЕНЕРАЦИЯ ID И ОЧИСТКА ДАННЫХ
    const newId = crypto.randomUUID();
    
    // Гарантируем, что сумма всегда положительная и округлена до копеек
    const safeAmount = Number(Math.abs(txData.amount).toFixed(2));
    
    // Базовая защита даты (если пришел мусор, ставим сейчас)
    const safeDate = Number.isNaN(Date.parse(txData.date)) 
      ? new Date().toISOString() 
      : new Date(txData.date).toISOString();

    const newTx: Transaction = {
      ...txData,
      id: newId,
      amount: safeAmount,
      date: safeDate,
    };

    set((state) => {
      const newList = [newTx, ...state.transactions];
      // 4. АВТОСОРТИРОВКА: Новые транзакции всегда сверху
      newList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return { transactions: newList };
    });

    return newId;
  },

  updateTransaction: (id, updates) => {
    let isSuccess = false;

    set((state) => {
      const index = state.transactions.findIndex((t) => t.id === id);
      if (index === -1) return state; // Транзакция не найдена, ничего не делаем

      isSuccess = true;
      const txToUpdate = { ...state.transactions[index], ...updates };

      // Защита суммы при обновлении
      if (updates.amount !== undefined) {
        txToUpdate.amount = Number(Math.abs(updates.amount).toFixed(2));
      }

      const newList = [...state.transactions];
      newList[index] = txToUpdate;

      // Если изменили дату, нужно пересортировать массив
      if (updates.date) {
        newList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      return { transactions: newList };
    });

    return isSuccess;
  },

  deleteTransaction: (id) => {
    let isSuccess = false;

    set((state) => {
      const filteredList = state.transactions.filter((t) => t.id !== id);
      
      // Если длина не изменилась, значит такого ID не было
      if (filteredList.length === state.transactions.length) return state;

      isSuccess = true;
      return { transactions: filteredList };
    });

    return isSuccess;
  },

  // 5. ИНФРАСТРУКТУРА ДЛЯ РЕАЛЬНОГО API
  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      // Имитация задержки сети
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Здесь будет const response = await fetch('/api/transactions');
      set({ isLoading: false });
    } catch (err) {
      set({ error: 'Failed to load transactions', isLoading: false });
    }
  },
}));