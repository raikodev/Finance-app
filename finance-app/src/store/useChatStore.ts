import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Строгая типизация для сообщений
export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // Начальное состояние — одно приветственное сообщение от ИИ
      messages: [{ sender: 'ai', text: 'Привет! Я твой ИИ-ассистент.' }],
      
      // Функция добавления нового сообщения в массив
      addMessage: (message) => 
        set((state) => ({ messages: [...state.messages, message] })),
      
      // Функция для очистки чата (на будущее)
      clearChat: () => 
        set({ messages: [] }),
    }),
    { name: 'finance-chat-store' } // Ключ для localStorage
  )
);