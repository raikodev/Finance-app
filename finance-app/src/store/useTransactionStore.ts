import { create } from 'zustand';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Expense' | 'Income';
  amount: number;
  currency: string;
  iconType?: string;
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  // В будущем здесь будет метод загрузки данных с API:
  // setTransactions: (transactions: Transaction[]) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  // Стартовые мок-данные (позже замените на пустой массив [], когда подключите бэкенд)
  transactions: [
    { id: '1', date: new Date().toISOString(), description: 'Stripe Payout', category: 'Freelance', type: 'Income', amount: 3200, currency: 'USD', iconType: 'other' },
    { id: '2', date: new Date(Date.now() - 86400000).toISOString(), description: 'AWS Cloud Services', category: 'Housing', type: 'Expense', amount: -142.50, currency: 'USD', iconType: 'other' },
    { id: '3', date: new Date(Date.now() - 172800000).toISOString(), description: 'Vercel Pro', category: 'Transport', type: 'Expense', amount: -20, currency: 'USD', iconType: 'other' },
  ],
  
  // Добавляем новую транзакцию в начало списка
  addTransaction: (tx) => 
    set((state) => ({ transactions: [tx, ...state.transactions] })),
    
  // Удаляем транзакцию по ID
  deleteTransaction: (id) => 
    set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
}));