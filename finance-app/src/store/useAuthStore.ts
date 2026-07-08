import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. СТРОГИЕ РОЛИ И ТИПЫ
export type Role = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string; // У гостя email нет!
  role: Role;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: number | null; // Контроль жизни сессии

  // Экшены возвращают Promise, чтобы UI мог показать спиннер и обработать ошибку
  loginWithEmail: (name: string, email: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// 2. ВАЛИДАЦИЯ EMAIL
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 часа

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      sessionExpiresAt: null,

      loginWithEmail: async (name, email) => {
        set({ isLoading: true, error: null });

        try {
          // 3. БАЗОВАЯ ВАЛИДАЦИЯ НА ФРОНТЕНДЕ
          const trimmedName = name.trim();
          const trimmedEmail = email.trim();

          if (!trimmedName) throw new Error('Name is required');
          if (!isValidEmail(trimmedEmail)) throw new Error('Invalid email format');

          // Имитация запроса к API
          await new Promise((resolve) => setTimeout(resolve, 800));

          set({
            user: {
              id: crypto.randomUUID(),
              name: trimmedName,
              email: trimmedEmail,
              role: 'user',
            },
            sessionExpiresAt: Date.now() + SESSION_DURATION,
          });
        } catch (err: any) {
          set({ error: err.message || 'Login failed' });
        } finally {
          set({ isLoading: false });
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          set({
            user: {
              id: 'guest-' + crypto.randomUUID().slice(0, 8),
              name: 'Guest',
              // Больше никакого фейкового email!
              role: 'guest',
            },
            sessionExpiresAt: Date.now() + SESSION_DURATION,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, sessionExpiresAt: null, error: null });
        
        // 4. ОЧИСТКА ВСЕХ СТОРОВ ПРИ ЛОГАУТЕ
        // Мы вызываем глобальное событие, на которое подпишутся другие сторы
        window.dispatchEvent(new Event('auth-logout'));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-session', // Безличное имя ключа (не выдает бренд)
      
      // 5. ПРОВЕРКА ВРЕМЕНИ ЖИЗНИ СЕССИИ ПРИ ЗАГРУЗКЕ
      onRehydrateStorage: () => (state) => {
        if (state && state.sessionExpiresAt) {
          if (Date.now() > state.sessionExpiresAt) {
            // Сессия истекла -> разлогиниваем
            state.user = null;
            state.sessionExpiresAt = null;
          }
        }
      },
      
      // В production мы вообще отключим persist для авторизации и будем 
      // полагаться на HttpOnly cookie, приходящую с бэкенда!
      // storage: createJSONStorage(() => sessionStorage), // MVP вариант защиты
    }
  )
);