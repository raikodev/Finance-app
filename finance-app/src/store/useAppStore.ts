import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. СТРОГИЕ ТИПЫ (Никаких произвольных строк)
export type AppLanguage = 'en' | 'pl' | 'ru';
export type AppCurrency = 'USD' | 'EUR' | 'RUB' | 'PLN';

interface AppState {
  // Данные
  isDarkMode: boolean;
  lang: AppLanguage;
  currency: AppCurrency;

  // Экшены
  toggleTheme: () => void;
  setLang: (lang: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  resetSettings: () => void; // Метод для сброса настроек
}

// 2. УМНЫЙ ДЕФОЛТ (Слушаем систему пользователя)
const getSystemTheme = (): boolean => {
  // Проверка на typeof window нужна для безопасного SSR (если в будущем будет Next.js)
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // Fallback на тёмную тему по умолчанию
};

const DEFAULT_SETTINGS = {
  isDarkMode: getSystemTheme(),
  lang: 'en' as AppLanguage,
  currency: 'USD' as AppCurrency,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      setLang: (lang) => set({ lang }),
      
      setCurrency: (currency) => set({ currency }),

      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'nickel-app-settings-v1', // Неймспейсинг + версионирование
      version: 1, // Готовность к миграциям (например, если добавится язык 'de')
      
      // 3. ГИГИЕНА ХРАНИЛИЩА (partialize)
      // В localStorage сохраняем ТОЛЬКО значения. Функции туда больше не пишутся!
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        lang: state.lang,
        currency: state.currency,
      }),
    }
  )
);

// 4. ОЧИСТКА ПРИ ЛОГАУТЕ
// Синхронизация с useAuthStore: сбрасываем настройки к дефолту при выходе пользователя
if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    useAppStore.setState({ ...DEFAULT_SETTINGS });
  });
}