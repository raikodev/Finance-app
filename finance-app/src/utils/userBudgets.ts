import { BUDGETS_STORAGE_KEY } from './storageKeys';

// Бюджеты хранятся в localStorage отдельно от zustand (см. BudgetsPage).
// Общие функции нужны, чтобы страница бюджетов и каскадное удаление категорий
// работали с одним и тем же форматом и не расходились.
export interface UserBudget {
  id: string;
  category: string;
  limit: number;
}

const isBudget = (value: unknown): value is UserBudget => {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return typeof b.id === 'string'
    && typeof b.category === 'string'
    && typeof b.limit === 'number';
};

// null означает "в хранилище ничего нет" — вызывающая сторона сама решает,
// подставить ли демо-бюджеты для первого запуска.
export const loadUserBudgets = (): UserBudget[] | null => {
  try {
    const raw = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isBudget);
  } catch {
    return null;
  }
};

export const saveUserBudgets = (budgets: UserBudget[]): boolean => {
  try {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
    return true;
  } catch {
    return false;
  }
};

// Удаляет бюджеты удалённой категории. Возвращает количество удалённых,
// чтобы UI мог показать/не показывать дополнительное уведомление.
export const removeBudgetsForCategory = (category: string): number => {
  const budgets = loadUserBudgets();
  if (!budgets) return 0;

  const lower = category.trim().toLowerCase();
  const filtered = budgets.filter(b => b.category.toLowerCase() !== lower);
  const removed = budgets.length - filtered.length;

  if (removed > 0) saveUserBudgets(filtered);
  return removed;
};

export const clearUserBudgets = (): void => {
  // Пишем пустой массив, а не удаляем ключ: отсутствие ключа означает
  // «бюджеты ещё не создавались», и BudgetsPage снова подставил бы демо.
  // Пустой массив — это осознанное состояние «бюджетов нет».
  saveUserBudgets([]);
};
