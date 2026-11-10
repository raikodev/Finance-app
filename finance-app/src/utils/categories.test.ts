import { describe, expect, it } from 'vitest';
import {
  getCategoryMetaFromSnapshot,
  getCategorySnapshot,
} from './categories';

describe('getCategorySnapshot', () => {
  it('сохраняет hex и ключ иконки встроенной категории', () => {
    expect(getCategorySnapshot('Food')).toEqual({
      categoryColor: '#f43f5e',
      categoryIcon: 'coffee',
    });
  });

  it('для неизвестной категории сохраняет нейтральный вид', () => {
    expect(getCategorySnapshot('No longer exists')).toEqual({
      categoryColor: '#64748b',
      categoryIcon: 'folder',
    });
  });
});

describe('getCategoryMetaFromSnapshot', () => {
  it('без снапшота работает как раньше', () => {
    const meta = getCategoryMetaFromSnapshot('Food');

    expect(meta.hex).toBe('#f43f5e');
    expect(meta.iconKey).toBe('coffee');
  });

  it('берёт вид из снапшота даже если категория удалена', () => {
    const meta = getCategoryMetaFromSnapshot('Deleted category', {
      categoryColor: '#8b5cf6',
      categoryIcon: 'music',
    });

    expect(meta.hex).toBe('#8b5cf6');
    expect(meta.iconKey).toBe('music');
    expect(meta.isCustomColor).toBe(false);
  });

  it('поддерживает пользовательский hex вне палитры', () => {
    const meta = getCategoryMetaFromSnapshot('Deleted category', {
      categoryColor: '#123abc',
      categoryIcon: 'gifts',
    });

    expect(meta.hex).toBe('#123abc');
    expect(meta.isCustomColor).toBe(true);
    expect(meta.iconKey).toBe('gifts');
  });

  it('игнорирует некорректный цвет из снапшота', () => {
    const meta = getCategoryMetaFromSnapshot('Food', {
      categoryColor: 'not-a-color',
      categoryIcon: 'music',
    });

    expect(meta.hex).toBe('#f43f5e');
    expect(meta.iconKey).toBe('coffee');
  });

  it('при неизвестном ключе иконки оставляет иконку живой категории', () => {
    const meta = getCategoryMetaFromSnapshot('Food', {
      categoryColor: '#f43f5e',
      categoryIcon: 'unknown-icon',
    });

    expect(meta.iconKey).toBe('coffee');
  });
});
