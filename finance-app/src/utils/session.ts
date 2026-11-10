// Максимальная задержка setTimeout (2^31 - 1 мс ≈ 24.8 дня).
// Для более длинных сессий таймер перепланируется частями.
export const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Сколько миллисекунд осталось до истечения сессии.
 * `null` — срок сессии неизвестен/некорректен, `0` — уже истекла.
 */
export const getSessionRemainingMs = (
  expiresAt: number | null,
  now: number = Date.now(),
): number | null => {
  if (expiresAt === null || !Number.isFinite(expiresAt)) return null;
  return Math.max(0, expiresAt - now);
};
