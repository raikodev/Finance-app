import { Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import StatCard from './StatCard';
import { useAppStore } from '../store/useAppStore';

interface StatsGridProps {
  displayBalance: number;
  displayIncome: number;
  displayExpenses: number;
  recordCount: number;
  trends?: {
    balance?: number;
    income?: number;
    expenses?: number;
    records?: number;
  };
  formatMoneyString: (amount: number, currency: string) => string;
  currency: string;
  t: any;
}

export default function StatsGrid({
  displayBalance,
  displayIncome,
  displayExpenses,
  recordCount,
  trends,
  formatMoneyString,
  currency,
  t
}: StatsGridProps) {
  const lang = useAppStore(s => s.lang);

  const formatNumberSafe = (num: number) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      return new Intl.NumberFormat(locale).format(num || 0);
    } catch (e) {
      return (num || 0).toString();
    }
  };

  const safeMoney = (val: number) => {
    const safeVal = isNaN(val) || !isFinite(val) ? 0 : val;
    return formatMoneyString(safeVal, currency);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title={t?.totalBalance || 'Total Balance'}
        value={safeMoney(displayBalance)}
        trend={trends?.balance}
        icon={<Wallet size={16} strokeWidth={2.5} />}
        color="orange"
        isPrimary
      />
      
      <StatCard
        title={t?.totalIncome || 'Total Income'}
        value={safeMoney(displayIncome)}
        trend={trends?.income}
        icon={<TrendingUp size={16} strokeWidth={2.5} />}
        color="emerald"
      />
      
      <StatCard
        title={t?.totalExpenses || 'Total Expenses'}
        value={safeMoney(displayExpenses)}
        trend={trends?.expenses}
        icon={<TrendingDown size={16} strokeWidth={2.5} />}
        color="rose"
        inverseTrend
      />
      
      <StatCard
        title={t?.records || 'Records'}
        value={formatNumberSafe(recordCount)}
        trend={trends?.records}
        icon={<Activity size={16} strokeWidth={2.5} />}
        color="blue"
      />
    </div>
  );
}