import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isAuthenticated: boolean;
  isDarkMode: boolean;
  lang: 'en' | 'pl' | 'ru';
  currency: string;
  login: () => void;
  logout: () => void;
  toggleTheme: () => void;
  setLang: (lang: 'en' | 'pl' | 'ru') => void;
  setCurrency: (currency: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isDarkMode: true,
      lang: 'en',
      currency: 'USD',
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setLang: (lang) => set({ lang }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'finance-app-settings' }
  )
);