import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// 1. СТРОГИЕ ИНТЕРФЕЙСЫ (Никаких any)
interface ChartData {
  date: string;
  income: number;
  expense: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface ChartsSectionProps {
  pieData: PieData[];
  areaData: ChartData[];
  displayExpenses: number;
  formatMoneyString: (amount: number, currency: string) => string;
  t: any; // В идеале здесь должен быть строгий интерфейс DASHBOARD_T
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export default function ChartsSection({ 
  pieData, 
  areaData, 
  displayExpenses, 
  formatMoneyString, 
  t 
}: ChartsSectionProps) {
  const currency = useAppStore(s => s.currency);
  const lang = useAppStore(s => s.lang);

  // 2. МУЛЬТИЯЗЫЧНЫЙ Y-AXIS (1.5k -> 1,5 тыс. -> 1,5 tys.)
  const formatTick = (value: number) => {
    if (value === 0) return '0';
    if (lang === 'ru') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)} тыс.`;
    } else if (lang === 'pl') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)} mln`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)} tys.`;
    }
    // Фолбек на английский (k/M)
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  // 3. СТРОГО ТИПИЗИРОВАННЫЙ ТУЛТИП (Без any!)
  const CustomAreaTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 p-3 rounded-xl shadow-lg">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs font-medium">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-500 capitalize">
                {/* 4. Локализация названия линий в тултипе */}
                {entry.dataKey === 'income' ? (t.income || 'Income') : (t.expenses || 'Expenses')}:
              </span>
              <span className="text-gray-900 dark:text-white font-bold">
                {formatMoneyString(Number(entry.value || 0), currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* ДОНАТ-ЧАРТ (Структура расходов) */}
      <div className="lg:col-span-1 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon size={20} className="text-orange-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">{t.spendingOverview || 'Spending Overview'}</h3>
        </div>
        
        {pieData.length > 0 ? (
          <>
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    innerRadius={65} 
                    outerRadius={85} 
                    paddingAngle={4} 
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatMoneyString(Number(value || 0), currency)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Сумма внутри круга */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.total || 'TOTAL'}</span>
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {formatMoneyString(displayExpenses, currency)}
                </span>
              </div>
            </div>
            
            {/* 5. ПОЛНАЯ ЛЕГЕНДА (Больше не обрезаем до топ-3) */}
            <div className="mt-6 space-y-3">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatMoneyString(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm font-medium">
            {t.noData || 'No data available'}
          </div>
        )}
      </div>

      {/* ЛИНЕЙНЫЙ ГРАФИК (Денежный поток) */}
      <div className="lg:col-span-2 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t.cashFlow || 'Cash Flow Analytics'}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {t.income || 'Income'}
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              {t.expenses || 'Expenses'}
            </div>
          </div>
        </div>
        
        {areaData.length > 0 ? (
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={formatTick} 
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  fill="url(#colorIncome)" 
                  strokeWidth={2.5}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#f43f5e" 
                  fill="url(#colorExpense)" 
                  strokeWidth={2.5}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 min-h-[250px] flex items-center justify-center text-gray-400 text-sm font-medium">
            {t.noData || 'No data available'}
          </div>
        )}
      </div>
    </div>
  );
}