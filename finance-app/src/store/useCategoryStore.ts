import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CategoryType = 'expense' | 'income';

export interface CustomCategory {
  name: string;
  color: string; // ключ палитры (violet) или hex (#8b5cf6)
  icon: string; // ключ из CATEGORY_ICONS
  type: CategoryType;
}

export type AddCategoryResult = 'ok' | 'empty' | 'tooLong' | 'duplicate';

export const MAX_CATEGORY_NAME_LENGTH = 24;

// Встроенные категории — их нельзя дублировать пользовательскими
export const BUILTIN_CATEGORY_NAMES = [
  'food', 'housing', 'transport', 'software', 'subscriptions', 'shopping', 'salary', 'freelance',
];

interface CategoryState {
  customCategories: CustomCategory[];
  // Возвращает причину отказа, чтобы форма могла показать конкретную ошибку
  addCategory: (name: string, color: string, icon: string, type: CategoryType) => AddCategoryResult;
  // Удаляет пользовательскую категорию по имени (регистронезависимо)
  removeCategory: (name: string) => boolean;
  // Полная очистка — используется кнопкой "Удалить все данные" в настройках
  clearCategories: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      customCategories: [],
      addCategory: (name, color, icon, type) => {
        const trimmed = name.trim();
        if (!trimmed) return 'empty';
        if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) return 'tooLong';

        const lower = trimmed.toLowerCase();
        const takenByBuiltin = BUILTIN_CATEGORY_NAMES.includes(lower);
        const takenByCustom = get().customCategories.some(c => c.name.toLowerCase() === lower);
        if (takenByBuiltin || takenByCustom) return 'duplicate';

        set(state => ({
          customCategories: [
            ...state.customCategories,
            { name: trimmed, color, icon, type },
          ],
        }));
        return 'ok';
      },
      removeCategory: (name) => {
        const lower = name.trim().toLowerCase();
        const exists = get().customCategories.some(c => c.name.toLowerCase() === lower);
        if (!exists) return false;

        set(state => ({
          customCategories: state.customCategories.filter(
            c => c.name.toLowerCase() !== lower
          ),
        }));
        return true;
      },
      clearCategories: () => set({ customCategories: [] }),
    }),
    { name: 'clarity-custom-categories' }
  )
);
