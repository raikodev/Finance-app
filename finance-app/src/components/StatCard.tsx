import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'indigo' | 'emerald' | 'rose' | 'blue';
  inverseTrend?: boolean;
  isPrimary?: boolean;
}

export default function StatCard({ 
  title, value, icon, trend, trendLabel, color, inverseTrend = false, isPrimary = false 
}: StatCardProps) {
  
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  };

  const isPositiveTrend = trend !== undefined && trend > 0;
  const isGood = inverseTrend ? !isPositiveTrend : isPositiveTrend;
  
  const trendColor = isGood ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10' : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-400/10';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  // ЭЛИТНЫЙ SAAS ДИЗАЙН: Никаких неоновых свечений. Только строгие рамки и тонкие тени.
  const surfaceClasses = isPrimary
    ? "bg-white dark:bg-[#121214] border-gray-300 dark:border-white/[0.12] shadow-sm ring-1 ring-gray-900/5 dark:ring-white/5"
    : "bg-white dark:bg-[#0c0c0e] border-gray-200 dark:border-white/[0.06] shadow-sm";

  return (
    <div className={`group relative rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-white/[0.15] outline-none focus-within:ring-2 focus-within:ring-indigo-500/50 ${surfaceClasses}`} tabIndex={0}>
      <div className="p-4 flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${colorMap[color]}`}>
            {icon}
          </div>

          {trend !== undefined && (
            <div className="flex flex-col items-end">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums ${trendColor}`}>
                <TrendIcon size={12} strokeWidth={3} />
                <span>{Math.abs(trend)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 transition-colors ${isPrimary ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
            {title}
          </h3>
          {/* TABULAR-NUMS: Цифры больше не будут "прыгать" */}
          <p className={`font-bold tabular-nums tracking-tight transition-colors ${isPrimary ? 'text-[26px] text-gray-950 dark:text-white' : 'text-2xl text-gray-900 dark:text-gray-100'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}