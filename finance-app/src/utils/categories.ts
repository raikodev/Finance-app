import { 
  Coffee, Home, Car, MonitorPlay, Zap, 
  ShoppingBag, Briefcase, Globe, Folder 
} from 'lucide-react';

export const CATEGORY_META: Record<string, { icon: any, color: string, bg: string }> = {
  'Food': { icon: Coffee, color: 'text-rose-500', bg: 'bg-rose-500' },
  'Housing': { icon: Home, color: 'text-orange-500', bg: 'bg-orange-500' },
  'Transport': { icon: Car, color: 'text-orange-500', bg: 'bg-orange-500' },
  'Software': { icon: MonitorPlay, color: 'text-blue-500', bg: 'bg-blue-500' },
  'Subscriptions': { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500' },
  'Shopping': { icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500' },
  'Salary': { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  'Freelance': { icon: Globe, color: 'text-teal-500', bg: 'bg-teal-500' },
};

export const getCategoryMeta = (categoryName: string) => {
  return CATEGORY_META[categoryName] || { 
    icon: Folder, 
    color: 'text-slate-500', 
    bg: 'bg-slate-500' 
  };
};