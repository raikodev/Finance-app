import type { AppLanguage } from '../store/useAppStore';

// 1. СТРОГАЯ ТИПИЗАЦИЯ (Прощай, `any`)
// Если мы забудем перевести хотя бы одно слово на польский, TypeScript выдаст ошибку
export interface TranslationDictionary {
  menu: {
    dash: string;
    tx: string;
    cat: string;
    bud: string;
    rep: string;
    set: string;
    ai: string;
  };
  mode: string;
  dashboard: {
    welcome: string;
    subtitle: string;
    baseCurrency: string;
    addTransaction: string;
  };
  ai: {
    // 2. ДИНАМИЧЕСКИЕ ЗНАЧЕНИЯ (Функции вместо хардкода)
    greeting: (name: string) => string; 
    typing: string;
    clear: string;
    placeholder: string;
  };
  common: {
    noData: string;
    save: string;
    cancel: string;
    delete: string;
  };
}

// 3. ЕДИНЫЙ ОБЪЕКТ ПЕРЕВОДОВ
export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    menu: {
      dash: "Dashboard",
      tx: "Transactions",
      cat: "Categories",
      bud: "Budgets",
      rep: "Reports",
      set: "Settings",
      ai: "AI Assistant"
    },
    mode: "Dark Mode",
    dashboard: {
      welcome: "Welcome back",
      subtitle: "Here's what's happening with your finances today.",
      baseCurrency: "Base:",
      addTransaction: "Add"
    },
    ai: {
      // Имя передается из компонента! Никакого "Ilyar"
      greeting: (name) => `Hi ${name}! I'm Clarity AI. Ask me about your spending or specific categories.`,
      typing: "Clarity AI is thinking...",
      clear: "Clear chat",
      placeholder: "Ask about your finances..."
    },
    common: {
      noData: "No data available",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete"
    }
  },

  ru: {
    menu: {
      dash: "Дашборд",
      tx: "Транзакции",
      cat: "Категории",
      bud: "Бюджеты",
      rep: "Отчеты",
      set: "Настройки",
      ai: "ИИ Ассистент"
    },
    mode: "Темная тема",
    dashboard: {
      welcome: "С возвращением",
      subtitle: "Вот что происходит с вашими финансами сегодня.",
      baseCurrency: "Базовая:",
      addTransaction: "Добавить"
    },
    ai: {
      greeting: (name) => `Привет, ${name}! Я Clarity AI. Спросите меня о расходах или доходах.`,
      typing: "Clarity AI анализирует...",
      clear: "Очистить чат",
      placeholder: "Спросите о финансах..."
    },
    common: {
      noData: "Нет данных",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить"
    }
  },

  pl: {
    menu: {
      dash: "Panel główny",
      tx: "Transakcje",
      cat: "Kategorie",
      bud: "Budżety",
      rep: "Raporty",
      set: "Ustawienia",
      ai: "Asystent AI"
    },
    mode: "Tryb ciemny",
    dashboard: {
      welcome: "Witaj ponownie",
      subtitle: "Oto co dzieje się dzisiaj z Twoimi finansami.",
      baseCurrency: "Waluta:",
      addTransaction: "Dodaj"
    },
    ai: {
      greeting: (name) => `Cześć ${name}! Jestem Clarity AI. Zapytaj mnie o swoje wydatki.`,
      typing: "Clarity AI myśli...",
      clear: "Wyczyść czat",
      placeholder: "Zapytaj o swoje finanse..."
    },
    common: {
      noData: "Brak danych",
      save: "Zapisz",
      cancel: "Anuluj",
      delete: "Usuń"
    }
  }
};

// 4. УМНЫЙ ХУК ДЛЯ ПЕРЕВОДОВ (Чтобы не писать руками выбор языка в каждом файле)
export const useTranslation = (lang: AppLanguage) => {
  return TRANSLATIONS[lang];
};