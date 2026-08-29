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

export const MOCK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PLN: 4.01, RUB: 92.5, UAH: 39.5
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
