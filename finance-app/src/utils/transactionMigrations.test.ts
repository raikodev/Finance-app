import { describe, expect, it } from 'vitest';
import type { Transaction } from '../store/useTransactionStore';
import { migrateLegacyDemoDescriptions } from './transactionMigrations';

const transaction = (description: string): Transaction => ({
  id: '1',
  date: '2026-01-01T00:00:00.000Z',
  amount: 10,
  type: 'expense',
  category: 'Software',
  description,
  currency: 'USD',
});

describe('migrateLegacyDemoDescriptions', () => {
  it('переименовывает все старые демо-описания', () => {
    const migrated = migrateLegacyDemoDescriptions([
      transaction('Stripe Payout'),
      transaction('AWS Cloud Services'),
      transaction('Vercel Pro'),
      transaction('Uber Rides'),
    ]);

    expect(migrated.map((tx) => tx.description)).toEqual([
      'Stripe',
      'AWS',
      'Vercel',
      'Uber',
    ]);
  });

  it('не трогает пользовательские транзакции', () => {
    const original = transaction('Кофе с коллегами');
    const [migrated] = migrateLegacyDemoDescriptions([original]);

    expect(migrated).toBe(original);
  });

  it('сохраняет остальные поля транзакции', () => {
    const [migrated] = migrateLegacyDemoDescriptions([transaction('Uber Rides')]);

    expect(migrated).toEqual({
      id: '1',
      date: '2026-01-01T00:00:00.000Z',
      amount: 10,
      type: 'expense',
      category: 'Software',
      description: 'Uber',
      currency: 'USD',
    });
  });
});
