import type { Transaction } from '../store/useTransactionStore';

// Демо-данные до перехода на нейтральные бренды. Миграция нужна только
// существующим пользователям: у них эти строки уже лежат в localStorage.
const LEGACY_DEMO_DESCRIPTIONS: Record<string, string> = {
  'Stripe Payout': 'Stripe',
  'AWS Cloud Services': 'AWS',
  'Vercel Pro': 'Vercel',
  'Uber Rides': 'Uber',
};

/**
 * Переименовывает только известные демо-описания и не трогает остальные
 * транзакции пользователя.
 */
export const migrateLegacyDemoDescriptions = (transactions: Transaction[]): Transaction[] =>
  transactions.map((tx) => {
    const nextDescription = LEGACY_DEMO_DESCRIPTIONS[tx.description];
    return nextDescription ? { ...tx, description: nextDescription } : tx;
  });
