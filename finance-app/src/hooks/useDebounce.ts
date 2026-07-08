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

  useEffect(() => {
    // UX фикс: Если это строка и пользователь очистил поле ввода, 
    // сбрасываем значение мгновенно, без задержки.
    if (typeof value === 'string' && value === '') {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очистка таймера при размонтировании или изменении значения (предотвращает утечки и лишние рендеры)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}