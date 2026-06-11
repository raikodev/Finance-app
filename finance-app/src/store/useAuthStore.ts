import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginWithEmail: (name: string, email: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      // Обычная регистрация/логин
      loginWithEmail: (name, email) => 
        set({ 
          user: { name, email, isGuest: false }, 
          isAuthenticated: true 
        }),

      // Вход для просмотра функционала
      loginAsGuest: () => 
        set({ 
          user: { name: 'Guest User', email: 'guest@nickel.ai', isGuest: true }, 
          isAuthenticated: true 
        }),
        
      // Выход
      logout: () => 
        set({ 
          user: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: 'nickel-auth',
    }
  )
);