// Строго типизируем категории, чтобы совпадало со словарем
export type TransactionCategory = 'Housing' | 'Food' | 'Transport' | 'Entertainment' | 'Other' | 'Income';

export interface Transaction {
  id: string;
  date: string; // Используем ISO формат (например: '2026-05-21T10:00:00.000Z')
  description: string;
  category: TransactionCategory;
  type: 'Income' | 'Expense';
  amount: number;
  currency: string; // <-- Добавили обязательное поле валюты
  iconType: 'salary' | 'food' | 'rent' | 'transport' | 'entertainment' | 'other'; // Расширили иконки
}

// Моковые данные для первого запуска (initial state)
export const initialTransactions: Transaction[] = [
  {
    id: '1',
    date: '2026-05-21T09:00:00.000Z', // Свежая дата для проверки фильтра "Today"
    description: 'Salary',
    category: 'Income',
    type: 'Income',
    amount: 3000.00,
    currency: 'USD',
    iconType: 'salary',
  },
  {
    id: '2',
    date: '2026-05-19T14:30:00.000Z', // Дата для проверки фильтра "This Week"
    description: 'Grocery Store',
    category: 'Food',
    type: 'Expense',
    amount: -120.00,
    currency: 'USD',
    iconType: 'food',
  },
  {
    id: '3',
    date: '2026-05-01T10:00:00.000Z', // Дата для проверки фильтра "This Month"
    description: 'Apartment Rent',
    category: 'Housing',
    type: 'Expense',
    amount: -800.00,
    currency: 'USD',
    iconType: 'rent',
  },
  {
    id: '4',
    date: '2026-05-15T18:45:00.000Z',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    type: 'Expense',
    amount: -15.99,
    currency: 'EUR', // Проверим, как работает мультивалютность!
    iconType: 'entertainment',
  }
];