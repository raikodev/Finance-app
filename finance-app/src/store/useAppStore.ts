import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. СТРОГИЕ ТИПЫ (Никаких произвольных строк)
export type AppLanguage = 'en' | 'pl' | 'ru';
export type AppCurrency =
  | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'CHF' | 'CNY' | 'AUD' | 'CAD' | 'NZD'
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'ISK'
  | 'TRY' | 'BRL' | 'MXN' | 'ZAR' | 'INR' | 'KRW' | 'SGD' | 'HKD' | 'IDR'
  | 'ILS' | 'MYR' | 'PHP' | 'THB' | 'RUB' | 'BYN';

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

const getSystemTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
};

// Определяем язык браузера/ОС пользователя при самом первом визите.
// Работает ОДИН раз — как только пользователь явно выберет язык (setLang) или
// он уже сохранён в localStorage, persist-мидлвар зустанда восстановит именно
// сохранённое значение, а этот дефолт больше не используется.
const getSystemLanguage = (): AppLanguage => {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language?.split('-')[0].toLowerCase();
    if (browserLang === 'ru' || browserLang === 'pl' || browserLang === 'en') {
      return browserLang;
    }
  }
  return 'en'; // Фоллбэк для неподдерживаемых языков (например, немецкий, французский)
};

const DEFAULT_SETTINGS = {
  isDarkMode: getSystemTheme(),
  lang: getSystemLanguage(),
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