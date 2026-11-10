import { describe, expect, it } from 'vitest';
import { convertAmount, isSupportedCurrency, MOCK_RATES, SUPPORTED_CURRENCIES } from './currency';

describe('convertAmount', () => {
  it('возвращает ту же сумму для одинаковой валюты', () => {
    expect(convertAmount(123.45, 'USD', 'USD')).toBe(123.45);
  });

  it('конвертирует USD → EUR по курсам', () => {
    const rates = { USD: 1, EUR: 0.9 };
    expect(convertAmount(100, 'USD', 'EUR', rates)).toBeCloseTo(90, 10);
  });

  it('конвертирует обратно EUR → USD', () => {
    const rates = { USD: 1, EUR: 0.9 };
    expect(convertAmount(90, 'EUR', 'USD', rates)).toBeCloseTo(100, 10);
  });

  it('конвертация транзитивна через базовую валюту', () => {
    const rates = { USD: 1, EUR: 0.9, PLN: 4 };
    const eur = convertAmount(100, 'USD', 'EUR', rates);
    const pln = convertAmount(100, 'USD', 'PLN', rates);
    expect(convertAmount(eur, 'EUR', 'PLN', rates)).toBeCloseTo(pln, 10);
  });

  it('не падает на неизвестной валюте — использует курс 1', () => {
    const rates = { USD: 1, EUR: 0.5 };
    expect(convertAmount(100, 'BTC', 'EUR', rates)).toBeCloseTo(50, 10);
    expect(convertAmount(100, 'USD', 'BTC', rates)).toBeCloseTo(100, 10);
  });

  it('защищён от нулевого курса (деление на ноль)', () => {
    const rates = { USD: 0, EUR: 0.5 };
    expect(Number.isFinite(convertAmount(100, 'USD', 'EUR', rates))).toBe(true);
    expect(convertAmount(100, 'USD', 'EUR', rates)).toBeCloseTo(50, 10);
  });

  it('по умолчанию использует MOCK_RATES', () => {
    expect(convertAmount(100, 'USD', 'USD')).toBe(100);
    expect(convertAmount(100, 'USD', 'EUR')).toBeCloseTo(100 * MOCK_RATES.EUR, 10);
  });
});

describe('isSupportedCurrency', () => {
  it('принимает валюты из списка', () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(isSupportedCurrency(code)).toBe(true);
    }
  });

  it('отклоняет неизвестные и строчные коды', () => {
    expect(isSupportedCurrency('BTC')).toBe(false);
    expect(isSupportedCurrency('usd')).toBe(false);
    expect(isSupportedCurrency('')).toBe(false);
  });
});
