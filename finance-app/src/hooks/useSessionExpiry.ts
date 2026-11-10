import { useEffect } from 'react';
import toast from 'react-hot-toast';
import i18n from '../i18n';
import { useAuthStore } from '../store/useAuthStore';
import { getSessionRemainingMs, MAX_TIMEOUT_MS } from '../utils/session';

/**
 * Разлогинивает пользователя, когда истекает `sessionExpiresAt`, не дожидаясь
 * перезагрузки страницы. Перепроверяет срок при возврате фокуса/вкладки, чтобы
 * поймать спящий режим и throttling таймеров в фоновых вкладках.
 */
export function useSessionExpiry() {
  const user = useAuthStore((state) => state.user);
  const sessionExpiresAt = useAuthStore((state) => state.sessionExpiresAt);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user || sessionExpiresAt === null) return;

    let timerId: ReturnType<typeof setTimeout> | undefined;
    let hasExpired = false;

    const expire = () => {
      if (hasExpired) return;
      // Пользователь мог выйти вручную, пока таймер ещё тикал.
      if (!useAuthStore.getState().user) return;

      hasExpired = true;
      logout();
      toast.error(i18n.t('auth.sessionExpired'));
    };

    const schedule = () => {
      const remaining = getSessionRemainingMs(sessionExpiresAt);
      if (remaining === null) return;
      if (remaining === 0) {
        expire();
        return;
      }
      timerId = setTimeout(schedule, Math.min(remaining, MAX_TIMEOUT_MS));
    };

    const check = () => {
      if (getSessionRemainingMs(sessionExpiresAt) === 0) expire();
    };

    schedule();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);

    return () => {
      if (timerId !== undefined) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [user, sessionExpiresAt, logout]);
}
