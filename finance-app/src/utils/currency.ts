// ============================================================================
// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ КОНВЕРТАЦИИ ВАЛЮТ
// ============================================================================
// Раньше эта логика (или её отсутствие!) была раскидана по 5 файлам:
// useDashboardData.ts, AIHub.tsx, CategoriesPage.tsx, BudgetsPage.tsx,
// ReportsPage.tsx, AIAssistant.tsx. В нескольких из них суммы разных валют
// складывались напрямую (tx.amount) без конвертации в базовую валюту —
// то есть $145 + €16 + zł85 превращались в одно число, которое затем
// подписывалось текущей выбранной валютой. Теперь любая агрегация сумм
// по нескольким транзакциям должна проходить через convertAmount ниже.
//
// В реальном приложении MOCK_RATES заменится на данные из API
// (например, exchangerate-api.com), обновляемые периодически.
// ============================================================================

import type { AppCurrency } from '../store/useAppStore';

export const SUPPORTED_CURRENCIES: AppCurrency[] = [
  'USD', 'EUR', 'JPY', 'GBP', 'CHF', 'CNY', 'AUD', 'CAD', 'NZD',
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK', 'TRY', 
  'BRL', 'MXN', 'ZAR', 'INR', 'KRW', 'SGD', 'HKD', 'IDR', 'ILS', 
  'MYR', 'PHP', 'THB', 'RUB', 'BYN',
];

/** Проверяет, что строка — одна из реально поддерживаемых валют */
export function isSupportedCurrency(code: string): code is AppCurrency {
  return (SUPPORTED_CURRENCIES as string[]).includes(code);
}

export const MOCK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, JPY: 149, GBP: 0.79, CHF: 0.88, CNY: 7.1,
  AUD: 1.52, CAD: 1.36, NZD: 1.66, SEK: 10.4, NOK: 10.6, DKK: 6.86,
  PLN: 4.01, CZK: 23.5, HUF: 356, RON: 4.58, BGN: 1.80, ISK: 138,
  TRY: 34.2, BRL: 5.1, MXN: 17.0, ZAR: 18.2, INR: 83.3, KRW: 1330,
  SGD: 1.34, HKD: 7.82, IDR: 15700, ILS: 3.75, MYR: 4.47, PHP: 56.5,
  THB: 35.0, RUB: 90, BYN: 3.2,
};

/**
 * Конвертирует сумму из одной валюты в другую через MOCK_RATES.
 * Защищена от неизвестных валют и деления на ноль — в худшем случае
 * просто не конвертирует (курс 1), а не роняет приложение.
 */
export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = MOCK_RATES
): number => {
  if (fromCurrency === toCurrency) return amount;
  const rateFrom = rates[fromCurrency] || 1;
  const rateTo = rates[toCurrency] || 1;
  const baseAmount = amount / rateFrom;
  return baseAmount * rateTo;
};
