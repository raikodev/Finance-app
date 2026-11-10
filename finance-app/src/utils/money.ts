// ============================================================================
// ДЕНЕЖНАЯ АРИФМЕТИКА — работа через целые центы, чтобы избежать
// накопления ошибок плавающей точки (0.1 + 0.2 !== 0.3 и т.п.)
// ============================================================================
// ВАЖНО: формат хранения Transaction.amount остаётся decimal (не изменён на
// целые центы) — это осознанное решение, вынесенное за скобки как слишком
// рискованное для текущего объёма изменений. Эти функции — внутренний
// safety net для арифметики (сложение/умножение), а не смена формата хранения.
// ============================================================================

/** Переводит сумму в decimal-формате в целые центы (округление до ближайшего цента) */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  // Number.EPSILON компенсирует представление вида 1.005 → 1.0049999999999999,
  // иначе Math.round ошибочно округляет вниз. Знак учитываем отдельно,
  // чтобы отрицательные суммы округлялись симметрично (−1.005 → −101).
  const sign = amount < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(amount) + Number.EPSILON) * 100);
}

/** Обратная операция: целые центы → decimal-сумма */
export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

/**
 * Складывает список decimal-сумм через целые центы, чтобы избежать
 * float-дрифта при накоплении (особенно заметно на больших списках
 * транзакций — сумма 1000 чисел с плавающей точкой может разъехаться
 * на несколько центов от "правильного" результата).
 */
export function sumMoney(amounts: number[]): number {
  const totalCents = amounts.reduce((acc, amount) => acc + toCents(amount), 0);
  return fromCents(totalCents);
}

/**
 * Умножает decimal-сумму на коэффициент (курс валюты, процент и т.п.)
 * через целые центы. Коэффициент НЕ переводится в центы — только сама сумма.
 */
export function multiplyMoney(amount: number, factor: number): number {
  if (!Number.isFinite(factor)) return 0;
  const cents = toCents(amount);
  return fromCents(Math.round(cents * factor));
}

/**
 * Безопасный парсинг денежной суммы из "грязной" строки (ручной ввод или OCR).
 * Наивный .replace(',', '.') ломается на "1.234,56" (EU-формат: точка —
 * разделитель тысяч) — превращает 1234.56 в 1.234, теряя сумму молча.
 *
 * Здесь ПОСЛЕДНИЙ встреченный разделитель (точка или запятая) считается
 * десятичным, всё, что раньше — разделители тысяч и выбрасывается.
 * Так корректно парсятся и "1.234,56" (EU), и "1,234.56" (US), и просто "1234.56".
 */
export function parseMoneyString(raw: string): number {
  const cleaned = String(raw ?? '').trim();
  if (!cleaned) return NaN;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSepIndex = Math.max(lastComma, lastDot);

  if (decimalSepIndex === -1) {
    return parseFloat(cleaned.replace(/[^0-9-]/g, ''));
  }

  const integerPart = cleaned.slice(0, decimalSepIndex).replace(/[^0-9-]/g, '');
  const fractionalPart = cleaned.slice(decimalSepIndex + 1).replace(/[^0-9]/g, '');

  return parseFloat(`${integerPart}.${fractionalPart}`);
}
