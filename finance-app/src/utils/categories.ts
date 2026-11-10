import type { LucideIcon } from 'lucide-react';
import {
  Coffee, Home, Car, MonitorPlay, Zap, ShoppingBag, Briefcase, Globe, Folder,
  Utensils, Plane, HeartPulse, GraduationCap, Gamepad2, Gift, PawPrint, Dumbbell,
  Music, Smartphone, Shirt, Fuel, Baby, BookOpen, Wrench, Heart,
} from 'lucide-react';
import { useCategoryStore } from '../store/useCategoryStore';

export interface CategoryPalette {
  hex: string;
  color: string; // text-класс (только для пресетов)
  bg: string; // сплошной bg-класс (только для пресетов)
  iconBg: string; // полупрозрачный bg-класс (только для пресетов)
}

// Палитра с явно различимыми оттенками: тёплые (красный/оранжевый/жёлтый),
// холодные (бирюзовый/синий/фиолетовый) и нейтральный серый.
export const CUSTOM_CATEGORY_COLORS: Record<string, CategoryPalette> = {
  red: { hex: '#f43f5e', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
  orange: { hex: '#f97316', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-500/10' },
  amber: { hex: '#f59e0b', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-500/10' },
  lime: { hex: '#84cc16', color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-500', iconBg: 'bg-lime-50 dark:bg-lime-500/10' },
  emerald: { hex: '#10b981', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  cyan: { hex: '#06b6d4', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500', iconBg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  blue: { hex: '#3b82f6', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
  violet: { hex: '#8b5cf6', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500', iconBg: 'bg-violet-50 dark:bg-violet-500/10' },
  fuchsia: { hex: '#d946ef', color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500', iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10' },
  slate: { hex: '#64748b', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500', iconBg: 'bg-slate-50 dark:bg-slate-500/10' },
  // Устаревшие ключи: оставлены, чтобы уже сохранённые категории отображались корректно
  sky: { hex: '#0ea5e9', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500', iconBg: 'bg-sky-50 dark:bg-sky-500/10' },
  indigo: { hex: '#6366f1', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500', iconBg: 'bg-indigo-50 dark:bg-indigo-500/10' },
};

// Порядок цветов в палитре выбора (без устаревших sky/indigo)
export const PICKER_COLOR_KEYS = [
  'red', 'orange', 'amber', 'lime', 'emerald',
  'cyan', 'blue', 'violet', 'fuchsia', 'slate',
] as const;

export type PickerColorKey = typeof PICKER_COLOR_KEYS[number];

// Иконки, доступные для пользовательских категорий
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  food: Utensils,
  coffee: Coffee,
  home: Home,
  car: Car,
  software: MonitorPlay,
  zap: Zap,
  shopping: ShoppingBag,
  salary: Briefcase,
  freelance: Globe,
  plane: Plane,
  health: HeartPulse,
  education: GraduationCap,
  entertainment: Gamepad2,
  gifts: Gift,
  pets: PawPrint,
  sport: Dumbbell,
  music: Music,
  phone: Smartphone,
  clothes: Shirt,
  fuel: Fuel,
  kids: Baby,
  books: BookOpen,
  tools: Wrench,
  heart: Heart,
};

export const PICKER_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export interface CategoryMeta extends CategoryPalette {
  icon: LucideIcon;
  // Ключ иконки из CATEGORY_ICONS — его можно сохранить в транзакции,
  // потому что сам компонент LucideIcon в localStorage не сериализуется.
  iconKey: string;
  isCustomColor: boolean;
}

const palette = (key: string): CategoryPalette =>
  CUSTOM_CATEGORY_COLORS[key] || CUSTOM_CATEGORY_COLORS.violet;

// Встроенные категории: цвет + иконка. hex используется для графиков и inline-стилей,
// чтобы пользовательские hex-цвета отображались так же, как пресеты.
export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Food': { icon: Coffee, iconKey: 'coffee', ...palette('red'), isCustomColor: false },
  'Housing': { icon: Home, iconKey: 'home', ...palette('orange'), isCustomColor: false },
  'Transport': { icon: Car, iconKey: 'car', ...palette('amber'), isCustomColor: false },
  'Software': { icon: MonitorPlay, iconKey: 'software', ...palette('blue'), isCustomColor: false },
  'Subscriptions': { icon: Zap, iconKey: 'zap', ...palette('violet'), isCustomColor: false },
  'Shopping': { icon: ShoppingBag, iconKey: 'shopping', ...palette('fuchsia'), isCustomColor: false },
  'Salary': { icon: Briefcase, iconKey: 'salary', ...palette('emerald'), isCustomColor: false },
  'Freelance': { icon: Globe, iconKey: 'freelance', ...palette('cyan'), isCustomColor: false },
};

export const getCategoryMeta = (categoryName: string): CategoryMeta => {
  if (CATEGORY_META[categoryName]) {
    return CATEGORY_META[categoryName];
  }

  // Проверяем пользовательские категории (создаются на странице Categories).
  // getCategoryMeta — обычная функция, не хук, поэтому читаем стор напрямую
  // через getState() — это штатный способ зустанда для доступа вне компонента.
  const custom = useCategoryStore.getState().customCategories.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (custom) {
    const isHex = custom.color?.startsWith('#');
    const colorPalette: CategoryPalette = isHex
      ? { hex: custom.color, color: '', bg: '', iconBg: '' }
      : palette(custom.color);
    return {
      icon: CATEGORY_ICONS[custom.icon] || Folder,
      iconKey: CATEGORY_ICONS[custom.icon] ? custom.icon : 'folder',
      ...colorPalette,
      isCustomColor: Boolean(isHex),
    };
  }

  return {
    icon: Folder,
    iconKey: 'folder',
    ...palette('slate'),
    isCustomColor: false,
  };
};

// Цвет и иконка, которые можно сохранить в транзакции. Храним только
// сериализуемые значения (hex + ключ иконки), чтобы после удаления
// пользовательской категории старые операции не теряли свой вид.
export interface CategorySnapshot {
  categoryColor?: string;
  categoryIcon?: string;
}

const isHexColor = (value: string): boolean => /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value);

const findPaletteByHex = (hex: string): CategoryPalette | null => {
  const normalized = hex.toLowerCase();
  return Object.values(CUSTOM_CATEGORY_COLORS).find(
    (preset) => preset.hex.toLowerCase() === normalized
  ) ?? null;
};

export const getCategorySnapshot = (categoryName: string): CategorySnapshot => {
  const meta = getCategoryMeta(categoryName);
  return { categoryColor: meta.hex, categoryIcon: meta.iconKey };
};

/**
 * Разрешает вид категории: сначала сохранённый в транзакции снапшот,
 * затем живой стор. Для старых транзакций без снапшота поведение прежнее.
 */
export const getCategoryMetaFromSnapshot = (
  categoryName: string,
  snapshot?: CategorySnapshot | null,
): CategoryMeta => {
  const liveMeta = getCategoryMeta(categoryName);

  if (!snapshot?.categoryColor || !isHexColor(snapshot.categoryColor)) {
    return liveMeta;
  }

  const iconKey = snapshot.categoryIcon && CATEGORY_ICONS[snapshot.categoryIcon]
    ? snapshot.categoryIcon
    : liveMeta.iconKey;
  const preset = findPaletteByHex(snapshot.categoryColor);

  return {
    ...(preset ?? {
      hex: snapshot.categoryColor,
      color: '',
      bg: '',
      iconBg: '',
    }),
    icon: CATEGORY_ICONS[iconKey] || Folder,
    iconKey,
    isCustomColor: preset === null,
  };
};

// Категории, доступные для бюджетов: только расходные (без Salary/Freelance)
export const EXPENSE_CATEGORIES = [
  'Food',
  'Housing',
  'Transport',
  'Software',
  'Subscriptions',
  'Shopping',
];

// Контрастный цвет текста (галочки) на плашке выбранного цвета
export const getContrastColor = (hex: string): string => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
};

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

// Название категории для UI: переводим встроенные, пользовательские оставляем как есть
export const getCategoryLabel = (t: TranslateFn, name: string): string => {
  const translated = t(`categoryNames.${name.toLowerCase()}`, { defaultValue: name });
  return translated || name;
};
