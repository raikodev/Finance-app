import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearUserBudgets,
  loadUserBudgets,
  removeBudgetsForCategory,
  saveUserBudgets,
} from './userBudgets';
import { BUDGETS_STORAGE_KEY } from './storageKeys';

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadUserBudgets', () => {
  it('возвращает null, если в хранилище пусто', () => {
    expect(loadUserBudgets()).toBeNull();
  });

  it('возвращает null на битом JSON и не-массиве', () => {
    store.set(BUDGETS_STORAGE_KEY, 'not-json');
    expect(loadUserBudgets()).toBeNull();

    store.set(BUDGETS_STORAGE_KEY, '{"id":"1"}');
    expect(loadUserBudgets()).toBeNull();
  });

  it('отбрасывает записи неправильной формы', () => {
    store.set(BUDGETS_STORAGE_KEY, JSON.stringify([
      { id: '1', category: 'Food', limit: 100 },
      { id: '2', category: 'Pets', limit: 'many' },
      { category: 'Transport', limit: 50 },
    ]));

    expect(loadUserBudgets()).toEqual([{ id: '1', category: 'Food', limit: 100 }]);
  });
});

describe('saveUserBudgets', () => {
  it('сохраняет и читает обратно', () => {
    const budgets = [{ id: '1', category: 'Food', limit: 100 }];

    expect(saveUserBudgets(budgets)).toBe(true);
    expect(loadUserBudgets()).toEqual(budgets);
  });

  it('возвращает false, если localStorage недоступен', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
      removeItem: () => {},
    });

    expect(saveUserBudgets([{ id: '1', category: 'Food', limit: 1 }])).toBe(false);
  });
});

describe('removeBudgetsForCategory', () => {
  it('удаляет только совпавшую категорию без учёта регистра', () => {
    saveUserBudgets([
      { id: '1', category: 'Pets', limit: 100 },
      { id: '2', category: 'Food', limit: 50 },
    ]);

    expect(removeBudgetsForCategory('  pets ')).toBe(1);
    expect(loadUserBudgets()).toEqual([{ id: '2', category: 'Food', limit: 50 }]);
  });

  it('ничего не делает, если бюджета нет', () => {
    saveUserBudgets([{ id: '1', category: 'Food', limit: 50 }]);

    expect(removeBudgetsForCategory('Pets')).toBe(0);
    expect(loadUserBudgets()).toEqual([{ id: '1', category: 'Food', limit: 50 }]);
  });

  it('возвращает 0, если хранилище пусто', () => {
    expect(removeBudgetsForCategory('Food')).toBe(0);
  });
});

describe('clearUserBudgets', () => {
  it('очищает бюджеты и сохраняет пустое состояние', () => {
    saveUserBudgets([{ id: '1', category: 'Food', limit: 50 }]);

    clearUserBudgets();

    // Именно [], а не null: иначе BudgetsPage снова покажет демо-бюджеты.
    expect(loadUserBudgets()).toEqual([]);
    expect(store.has(BUDGETS_STORAGE_KEY)).toBe(true);
  });
});
