import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. СТРОГАЯ ТИПИЗАЦИЯ И СТАТУСЫ
export type Sender = 'user' | 'ai';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  timestamp: number;     // Для сортировки и отображения "5 минут назад"
  sender: Sender;
  text: string;
  status: MessageStatus; // Решает проблему "зависания" сообщений
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;     // Временное состояние (не сохраняется в localStorage)
  
  // Экшены
  addMessage: (text: string, sender: Sender, status?: MessageStatus) => string;
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  setTyping: (isTyping: boolean) => void;
  clearChat: () => void;
}

// Защита от переполнения localStorage (100 сообщений ~ 20-30 КБ)
const MAX_HISTORY_LENGTH = 100; 
const MAX_MESSAGE_LENGTH = 2000;

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // Приветствие УБРАНО из стейта. Массив изначально пуст.
      messages: [],
      isTyping: false,

      addMessage: (text, sender, status = 'sent') => {
        const id = crypto.randomUUID();
        const safeText = text.slice(0, MAX_MESSAGE_LENGTH); // Обрезаем "Войну и мир"
        
        const newMessage: ChatMessage = {
          id,
          timestamp: Date.now(),
          sender,
          text: safeText,
          status
        };

        set((state) => {
          // Ограничиваем историю чата, удаляя самые старые сообщения
          const updatedMessages = [...state.messages, newMessage].slice(-MAX_HISTORY_LENGTH);
          return { messages: updatedMessages };
        });

        return id;
      },

      updateMessageStatus: (id, status) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, status } : msg
          )
        }));
      },

      setTyping: (isTyping) => set({ isTyping }),

      clearChat: () => set({ messages: [] }),
    }),
    {
      name: 'finance-ai-chat-v1', // Неймспейс + Версионирование
      version: 1, // Готовность к миграциям в будущем
      
      // МАГИЯ PARTIALIZE: Сохраняем ТОЛЬКО массив сообщений. 
      // Функции и состояние 'isTyping' не загрязняют localStorage!
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);