import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Настройки уведомлений. Реальной отправки писем пока нет (нет бэкенда),
// но выбор пользователя должен хотя бы сохраняться между перезагрузками.
interface NotificationState {
  emailAlerts: boolean;
  monthlyReports: boolean;
  toggleEmailAlerts: () => void;
  toggleMonthlyReports: () => void;
  resetNotifications: () => void;
}

const DEFAULT_NOTIFICATIONS = {
  emailAlerts: true,
  monthlyReports: false,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      ...DEFAULT_NOTIFICATIONS,

      toggleEmailAlerts: () => set((state) => ({ emailAlerts: !state.emailAlerts })),
      toggleMonthlyReports: () => set((state) => ({ monthlyReports: !state.monthlyReports })),
      resetNotifications: () => set({ ...DEFAULT_NOTIFICATIONS }),
    }),
    {
      name: 'clarity-notification-preferences',
      version: 1,
      partialize: (state) => ({
        emailAlerts: state.emailAlerts,
        monthlyReports: state.monthlyReports,
      }),
    }
  )
);
