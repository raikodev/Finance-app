import { useState, useEffect } from 'react';

/**
 * Задерживает обновление значения на указанное время.
 * Идеально для оптимизации API-запросов. Для локальной фильтрации UI используйте `useDeferredValue`.
 *
 * @template T
 * @param {T} value - Значение, которое нужно "дебаунсить" (обычно строка поиска).
 * @param {number} [delay=300] - Задержка в миллисекундах (по умолчанию 300мс).
 * @returns {T} Значение с задержкой обновления.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // UX фикс: если пользователь очистил поле ввода, применяем значение сразу.
  // Нулевая задержка вместо синхронного setState в теле эффекта — так React
  // не делает каскадный рендер, а значение всё равно обновляется мгновенно.
  const effectiveDelay = typeof value === 'string' && value === '' ? 0 : delay;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, effectiveDelay);

    // Очистка таймера при размонтировании или изменении значения (предотвращает утечки и лишние рендеры)
    return () => {
      clearTimeout(handler);
    };
  }, [value, effectiveDelay]);

  return debouncedValue;
}