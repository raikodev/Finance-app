import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import StatCard from './StatCard';

interface StatsGridProps {
  displayBalance: number;
  displayIncome: number;
  displayExpenses: number;
  recordCount: number;
  currency: string;
  formatMoneyString: (amount: number, cur: string) => string;
  t: any;
  trends?: {
    balance: number;
    income: number;
    expenses: number;
    records: number;
  };
}

export default function StatsGrid({ 
  displayBalance, displayIncome, displayExpenses, recordCount, currency, formatMoneyString, t, trends 
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title={t.totalBalance} 
        value={formatMoneyString(displayBalance, currency)} 
        icon={<Wallet size={16} strokeWidth={2.5} />} 
        trend={trends?.balance}
        color="indigo" 
        isPrimary 
      />
      <StatCard 
        title={t.totalIncome} 
        value={formatMoneyString(displayIncome, currency)} 
        icon={<TrendingUp size={16} strokeWidth={2.5} />} 
        trend={trends?.income}
        color="emerald" 
      />
      <StatCard 
        title={t.totalExpenses} 
        value={formatMoneyString(displayExpenses, currency)} 
        icon={<TrendingDown size={16} strokeWidth={2.5} />} 
        trend={trends?.expenses}
        color="rose" 
        inverseTrend // Инвертируем: рост расходов это плохо (красный цвет)
      />
      <StatCard 
        title={t.activeRecords || "ACTIVE RECORDS"} 
        value={recordCount.toString()} 
        icon={<Activity size={16} strokeWidth={2.5} />} 
        trend={trends?.records}
        color="blue" 
      />
    </div>
  );
}