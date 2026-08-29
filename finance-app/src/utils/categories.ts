import { 
  Coffee, Home, Car, MonitorPlay, Zap, 
  ShoppingBag, Briefcase, Globe, Folder 
} from 'lucide-react';

export const CATEGORY_META: Record<string, { icon: any, color: string, bg: string, iconBg: string }> = {
  'Food': { icon: Coffee, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
  'Housing': { icon: Home, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-500/10' },
  'Transport': { icon: Car, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-500/10' },
  'Software': { icon: MonitorPlay, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
  'Subscriptions': { icon: Zap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-500/10' },
  'Shopping': { icon: ShoppingBag, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500', iconBg: 'bg-pink-50 dark:bg-pink-500/10' },
  'Salary': { icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  'Freelance': { icon: Globe, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500', iconBg: 'bg-teal-50 dark:bg-teal-500/10' },
};

export const getCategoryMeta = (categoryName: string) => {
  return CATEGORY_META[categoryName] || { 
    icon: Folder, 
    color: 'text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-500',
    iconBg: 'bg-slate-50 dark:bg-slate-500/10'
  };
};