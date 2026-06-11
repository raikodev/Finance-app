import { PieChart as PieChartIcon, Activity } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface ChartsSectionProps {
  pieData: any[];
  areaData: any[];
  displayExpenses: number;
  currency: string;
  formatMoneyString: (amount: number, curCode: string) => string;
  t: any;
}

export default function ChartsSection({ pieData, areaData, displayExpenses, currency, formatMoneyString, t }: ChartsSectionProps) {
  
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 p-3 rounded-lg shadow-xl dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]">
          <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-wider">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6 text-[13px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white tabular-nums tracking-tight">
                  {formatMoneyString(Number(entry.value), currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. ДОНАЙТ-ГРАФИК (Spending Overview) */}
      <div className="lg:col-span-4 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-sm dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] p-5 relative overflow-hidden transition-colors flex flex-col min-h-[340px]">
        <div className="absolute inset-0 pointer-events-none border border-black/[0.02] dark:border-white/[0.02] rounded-xl" />
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <PieChartIcon size={16} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight">
              {t.spendingOverview || 'Spending Overview'}
            </h3>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-2">
          {pieData.length > 0 ? (
            <>
              <div className="relative w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
                      itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value: any) => formatMoneyString(Number(value), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Total</span>
                  <span className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">
                    {formatMoneyString(displayExpenses, currency)}
                  </span>
                </div>
              </div>

              <div className="w-full mt-6 flex flex-col gap-2.5">
                {pieData.slice(0, 3).map((item, idx) => {
                  const percentage = displayExpenses > 0 ? Math.round((item.value / displayExpenses) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatMoneyString(item.value, currency)}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 font-medium w-8 text-right tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-gray-400 dark:text-gray-500">Not enough data to display.</p>
          )}
        </div>
      </div>

      {/* 2. ГРАФИК ДЕНЕЖНОГО ПОТОКА (Cash Flow Analytics) */}
      <div className="lg:col-span-8 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-sm dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] p-5 pb-2 relative overflow-hidden transition-colors flex flex-col min-h-[340px]">
        <div className="absolute inset-0 pointer-events-none border border-black/[0.02] dark:border-white/[0.02] rounded-xl" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Cash Flow Analytics
            </h3>
          </div>
          
          <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> 
              <span>Expenses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> 
              <span>Income</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-end relative z-10 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-white/5" />
              
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b8b8d', fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b8b8d', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                dx={-10}
              />
              
              <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Income"
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                name="Expenses"
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}