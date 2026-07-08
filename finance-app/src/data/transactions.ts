import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppCurrency } from '../store/useAppStore';

// 1. СТРОГИЕ И СИНХРОНИЗИРОВАННЫЕ КАТЕГОРИИ
// Точное совпадение с src/utils/categories.ts! Никаких "Income" или "Other".
export type TransactionCategory = 
  | 'Food' 
  | 'Housing' 
  | 'Transport' 
  | 'Software' 
  | 'Subscriptions' 
  | 'Shopping' 
  | 'Salary' 
  | 'Freelance';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  // AMOUNT ВСЕГДА ПОЛОЖИТЕЛЬНЫЙ. Логика плюса/минуса определяется по полю `type`
  amount: number; 
  currency: AppCurrency;
  date: string; // ISO string
  category: TransactionCategory;
  type: TransactionType;
}

// 2. ДИНАМИЧЕСКИЕ ДАТЫ (Больше никаких хардкодов 2026 года)
// Даты генерируются относительно текущего дня при загрузке приложения
const now = new Date();
const today = new Date().toISOString();
const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
const lastWeek = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
const lastMonth = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();

// 3. РЕАЛИСТИЧНЫЕ МОК-ДАННЫЕ С МУЛЬТИВАЛЮТНОСТЬЮ
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Upwork Contract',
    amount: 3200.00,
    currency: 'USD',
    date: today, // Попадет в фильтр "Today"
    category: 'Freelance',
    type: 'income',
  },
  {
    id: 'tx-2',
    description: 'Whole Foods Market',
    amount: 145.50,
    currency: 'USD',
    date: yesterday, // Попадет в фильтр "This Week"
    category: 'Food',
    type: 'expense',
  },
  {
    id: 'tx-3',
    description: 'Netflix Premium',
    amount: 15.99,
    currency: 'EUR', // Тестируем Евро
    date: lastWeek, // Попадет в фильтр "This Month"
    category: 'Subscriptions',
    type: 'expense',
  },
  {
    id: 'tx-4',
    description: 'Apartment Rent',
    amount: 1500.00,
    currency: 'USD',
    date: lastMonth, // Попадет в фильтр "All Time" (в зависимости от текущего числа)
    category: 'Housing',
    type: 'expense',
  },
  {
    id: 'tx-5',
    description: 'Uber Airport Ride',
    amount: 85.00,
    currency: 'PLN', // Тестируем Польский Злотый
    date: today,
    category: 'Transport',
    type: 'expense',
  }
];

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS,
      
      addTransaction: (txData) => set((state) => ({
        transactions: [
          // Генерируем уникальный ID для новых транзакций
          { ...txData, id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` },
          ...state.transactions
        ]
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(tx => tx.id !== id)
      })),
    }),
    {
      name: 'clarity-transactions', // Обновили имя хранилища под наш новый бренд
    }
  )
);