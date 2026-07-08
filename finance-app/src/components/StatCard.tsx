import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number; // Разрешили и числа, и строки
  trend?: number;
  icon: ReactNode;
  color: 'orange' | 'indigo' | 'emerald' | 'rose' | 'blue'; // Строгий список с нашим брендом
  isPrimary?: boolean;
  inverseTrend?: boolean; // Рост расходов = плохо
}

export default function StatCard({
  title,
  value,
  trend,
  icon,
  color,
  isPrimary = false,
  inverseTrend = false
}: StatCardProps) {
  
  // 1. ЕДИНАЯ ПАЛИТРА ЦВЕТОВ (Без оранжевого текста в синем фоне!)
  const colorMap = {
    orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    indigo: 'bg-orange-50 dark:bg-orange-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-orange-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  };

  // 2. БЕЗОПАСНАЯ И ЛОГИЧНАЯ ОБРАБОТКА ТРЕНДОВ
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend > 0;
  const isNeutral = hasTrend && trend === 0;
  const isNegative = hasTrend && trend < 0;

  // Логика цвета:
  // Если Neutral -> серый
  // Если inverseTrend (Расходы): рост = красный, падение = зеленый
  // Иначе (Доходы): рост = зеленый, падение = красный
  const isGood = inverseTrend ? isNegative : isPositive;
  const trendColorClass = isNeutral
    ? 'text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400'
    : isGood
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative p-5 rounded-2xl border transition-all duration-300 group ${
        isPrimary 
          ? 'bg-gradient-to-br from-white to-orange-50/30 dark:from-[#1A1A1D] dark:to-[#121214] border-orange-200/50 dark:border-orange-500/20 shadow-sm' 
          : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          {/* tabular-nums защищает от "скачущей" ширины символов при изменении баланса */}
          <h3 className={`font-bold tabular-nums tracking-tight ${isPrimary ? 'text-3xl' : 'text-2xl'} text-gray-900 dark:text-white`}>
            {value}
          </h3>
        </div>
        
        {/* Иконка */}
        <div className={`p-2.5 rounded-xl border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>

      {/* 3. ЧЕСТНЫЙ БЛОК ТРЕНДА */}
      {hasTrend && (
        <div className="flex items-center gap-2 mt-4">
          <div className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${trendColorClass}`}>
            {isNeutral ? (
              <Minus size={12} strokeWidth={3} />
            ) : isPositive ? (
              <TrendingUp size={12} strokeWidth={3} />
            ) : (
              <TrendingDown size={12} strokeWidth={3} />
            )}
            
            <span>
              {/* Всегда пишем положительное число, знак показывает иконка */}
              {isNeutral ? '0' : Math.abs(trend).toFixed(1)}%
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400">
            vs last period
          </span>
        </div>
      )}
    </motion.div>
  );
}