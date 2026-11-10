import { MOCK_RATES, SUPPORTED_CURRENCIES as ALL_CURRENCIES } from '../utils/currency';

// ============================================================================
// ЖИВЫЕ КУРСЫ ВАЛЮТ — Frankfurter API v2 (смешанные источники, не только ЕЦБ)
// ============================================================================
// v1 был построен только на данных ЕЦБ, который не публикует RUB (с 2022) и
// никогда не публиковал BYN — поэтому используем v2, где обе валюты есть
// через другие источники.
// Формат ответа v2 ДРУГОЙ, чем у v1: не объект {rates: {...}}, а массив
// [{date, base, quote, rate}, ...] — один элемент на валюту.
//
// Список валют для запроса берём из единого источника правды
// (utils/currency.ts SUPPORTED_CURRENCIES), а не дублируем его здесь —
// иначе рано или поздно список валют, для которых запрашиваются live-курсы,
// разойдётся со списком валют, которые реально разрешены в приложении.
// ============================================================================

// USD — база курсов (result.USD = 1 всегда), отдельно как "quote" не запрашиваем
const QUOTE_CURRENCIES = ALL_CURRENCIES.filter((c) => c !== 'USD');

interface FrankfurterV2Row {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=USD&quotes=${QUOTE_CURRENCIES.join(',')}`
    );

    if (!response.ok) {
      throw new Error(`Frankfurter API HTTP ${response.status}`);
    }

    const data: FrankfurterV2Row[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Unexpected response shape from Frankfurter API');
    }

    // Превращаем массив [{quote, rate}, ...] в плоский словарь {quote: rate}
    const rateByQuote: Record<string, number> = {};
    for (const row of data) {
      if (row?.quote && typeof row.rate === 'number') {
        rateByQuote[row.quote] = row.rate;
      }
    }

    // Собираем результат по каждой поддерживаемой валюте отдельно и
    // отслеживаем, для каких валют пришлось откатиться на MOCK_RATES —
    // это может случиться даже при HTTP 200, если конкретный провайдер
    // временно не опубликовал курс для одной-двух валют.
    const result: Record<string, number> = { USD: 1 };
    const fallbackCurrencies: string[] = [];

    for (const cur of QUOTE_CURRENCIES) {
      if (rateByQuote[cur] !== undefined) {
        result[cur] = rateByQuote[cur];
      } else {
        result[cur] = MOCK_RATES[cur] ?? 1;
        fallbackCurrencies.push(cur);
      }
    }

    if (import.meta.env.DEV && fallbackCurrencies.length > 0) {
      console.warn(
        `[exchangeRates] Frankfurter didn't return a rate for: ${fallbackCurrencies.join(', ')} — using MOCK_RATES for these`
      );
    }

    return result;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[exchangeRates] Live rates unavailable, using mock rates:', error);
    }
    return MOCK_RATES;
  }
}