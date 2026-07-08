export type TransactionType = 'income' | 'expense';

export interface TrendResult {
  value: number | null;        // Числовое значение (null, если рост с нуля)
  isInfinite: boolean;         // Флаг "рост с нуля" (бесконечность)
  direction: 'up' | 'down' | 'neutral'; 
  isPositive: boolean;         // ХОРОШО это для юзера или ПЛОХО (зеленый/красный цвет)
  formatted: string;           // Готовая строка для UI (например, "+50.5%")
}

/**
 * Вычисляет финансово-корректный тренд между двумя периодами.
 * Учитывает рост с нуля, отрицательные базы и тип транзакции (доход/расход).
 */
export const calculateTrend = (
  current: number,
  previous: number,
  type: TransactionType = 'income'
): TrendResult => {
  // 7. ЗАЩИТА ОТ НЕВАЛИДНЫХ ДАННЫХ
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { value: 0, isInfinite: false, direction: 'neutral', isPositive: true, formatted: '0%' };
  }

  // 2. ЛОЖНЫЙ НОЛЬ (Изменений не было)
  if (current === previous) {
    return { value: 0, isInfinite: false, direction: 'neutral', isPositive: true, formatted: '0%' };
  }

  // 1 & 3. РОСТ С НУЛЯ (Математическая бесконечность)
  if (previous === 0) {
    const isUp = current > 0;
    return {
      value: null, // Скрываем ложные 100%
      isInfinite: true,
      direction: isUp ? 'up' : 'down',
      // Для дохода рост с нуля — это хорошо. Для расхода рост с нуля — плохо.
      isPositive: type === 'income' ? isUp : !isUp,
      formatted: isUp ? 'New' : '-100%' // UI покажет "New" или значок ∞ вместо безумных процентов
    };
  }

  // 4 & 6. ПРАВИЛЬНАЯ ФИНАНСОВАЯ МАТЕМАТИКА
  // Math.abs в делителе нужен, чтобы правильно показать вектор при отрицательной базе
  const change = ((current - previous) / Math.abs(previous)) * 100;

  // 5. БЕЗОПАСНОЕ ОКРУГЛЕНИЕ ДО 1 ЗНАКА (Решение проблемы IEEE 754 без string/Number)
  const roundedChange = Math.round((change + Number.EPSILON) * 10) / 10;
  
  const direction = roundedChange > 0 ? 'up' : roundedChange < 0 ? 'down' : 'neutral';

  // 9. СЕМАНТИКА (Скрытая бизнес-логика)
  // Рост расходов (+50%) — это математически 'up', но для пользователя это плохо (isPositive: false)
  let isPositive = true;
  if (direction === 'up') isPositive = type === 'income';
  if (direction === 'down') isPositive = type === 'expense'; // Падение расходов = хорошо

  // Форматирование со знаком
  const sign = roundedChange > 0 ? '+' : '';

  return {
    value: roundedChange,
    isInfinite: false,
    direction,
    isPositive,
    formatted: `${sign}${roundedChange}%`
  };
};