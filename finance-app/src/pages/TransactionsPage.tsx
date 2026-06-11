import { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Search, ArrowDownRight, ArrowUpRight, Download, Plus, 
  Repeat, Trash2
} from 'lucide-react';

import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { APP_T } from '../locales/translations'; 

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function TransactionsPage() {
  const { lang } = useAppStore();
  const t = APP_T[lang] || APP_T['en']; 
  
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency', currency, minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || tx.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { date: Date; items: typeof transactions; total: number }> = {};
    
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = { date, items: [], total: 0 };
      }
      groups[dateKey].items.push(tx);
      const amount = tx.type === 'Income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      groups[dateKey].total += amount;
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTransactions]);

  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return lang === 'ru' ? 'Сегодня' : 'Today';
    if (isYesterday) return lang === 'ru' ? 'Вчера' : 'Yesterday';
    
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#060608] transition-colors duration-500">
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col">
        
        <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
                {t.menu?.tx || 'Transactions'}
              </h1>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
                Your full financial history.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Download size={14} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060608] outline-none">
                <Plus size={16} strokeWidth={2.5} />
                <span>{t.addRecord || 'Add'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-1.5 bg-gray-200/50 dark:bg-[#121214]/50 border border-gray-200/50 dark:border-white/[0.05] rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg text-gray-400 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all w-full shadow-sm">
              <Search size={14} className="shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description or category..." 
                className="bg-transparent border-none outline-none text-[13px] text-gray-900 dark:text-white flex-1 min-w-0"
              />
            </div>
            
            {/* ИСПРАВЛЕНИЕ 2: Убран overflow-x-auto, чтобы Windows не рисовал страшный скроллбар */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {['All', 'Income', 'Expense'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as any)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all shadow-sm border ${
                    typeFilter === type 
                      ? 'bg-white dark:bg-[#222226] text-gray-900 dark:text-white border-gray-200 dark:border-white/10' 
                      : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
            {groupedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm">
                <Search className="text-gray-300 dark:text-gray-600 mb-3" size={32} />
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">No transactions found</h3>
                <p className="text-[13px] text-gray-500 max-w-xs">Adjust your search or add a new record to see them here.</p>
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <motion.div key={group.date.toISOString()} variants={itemVariants} className="flex flex-col">
                  
                  <div className="flex items-center justify-between py-2 px-1 sticky top-0 bg-gray-50/90 dark:bg-[#060608]/90 backdrop-blur-md z-10 mb-2">
                    <h2 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider capitalize">
                      {formatDayHeader(group.date)}
                    </h2>
                    <span className={`text-[13px] font-bold tabular-nums ${
                      group.total > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                      group.total < 0 ? 'text-rose-600 dark:text-rose-400' : 
                      'text-gray-900 dark:text-gray-300'
                    }`}>
                      {group.total > 0 ? '+' : ''}{formatMoney(group.total, group.items[0]?.currency || 'USD')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden flex flex-col divide-y divide-gray-100 dark:divide-white/[0.04]">
                    {group.items.map((tx) => {
                      const isIncome = tx.type === 'Income';
                      const Icon = isIncome ? ArrowDownRight : ArrowUpRight;
                      const isRecurring = ['Housing', 'Software', 'Subscriptions'].includes(tx.category);

                      return (
                        <div key={tx.id} className="group flex items-center justify-between p-4 sm:px-5 hover:bg-gray-50/80 dark:hover:bg-white/[0.015] transition-colors relative cursor-pointer">
                          
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm transition-colors ${
                              isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100/50 dark:border-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              <Icon size={18} strokeWidth={2.5} />
                            </div>
                            
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight truncate">
                                  {tx.description}
                                </h4>
                                {isRecurring && <Repeat size={12} className="text-gray-400 shrink-0" />}
                              </div>
                              <p className="text-[12px] text-gray-500 font-medium truncate">
                                {tx.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 pl-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                              className="hidden sm:flex p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100 outline-none focus-visible:opacity-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>

                            <div className="text-right">
                              <p className={`text-[15px] font-bold tabular-nums tracking-tight ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isIncome ? '+' : '-'}{formatMoney(Math.abs(tx.amount), tx.currency)}
                              </p>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}