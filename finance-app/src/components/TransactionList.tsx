import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ArrowUpRight, ArrowDownRight, Trash2, 
  CreditCard, Repeat, CheckCircle2, Clock, Copy, Check
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Expense' | 'Income';
  amount: number;
  currency: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  formatAmount: (amount: number, currency: string) => string;
  t: any;
}

export default function TransactionList({ transactions, onDelete, formatAmount, t }: TransactionListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-sm overflow-hidden transition-colors relative flex flex-col">
      <div className="absolute inset-0 pointer-events-none border border-black/[0.02] dark:border-white/[0.02] rounded-xl z-10" />

      {/* ШАПКА ТАБЛИЦЫ С УЛУЧШЕННОЙ ИЕРАРХИЕЙ */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#121214]/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight">
            Transactions
          </h3>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-white/5">
            {transactions.length}
          </span>
        </div>
        
        {/* Фильтры-табы уровня Stripe */}
        <div className="hidden sm:flex items-center p-0.5 bg-gray-100 dark:bg-[#161618] border border-gray-200 dark:border-white/5 rounded-lg">
          <button className="px-3 py-1 text-[11px] font-semibold bg-white dark:bg-[#222226] text-gray-900 dark:text-white rounded-md shadow-sm border border-gray-200 dark:border-white/10 transition-all">All</button>
          <button className="px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">Completed</button>
          <button className="px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">Pending</button>
        </div>
      </div>

      {/* ЗАГОЛОВКИ КОЛОНОК (Решают проблему пустого пространства на Desktop) */}
      {transactions.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-gray-50/30 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.04] text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          <div className="col-span-5 lg:col-span-4">Transaction</div>
          <div className="col-span-3 lg:col-span-4">Details</div>
          <div className="col-span-4 text-right">Amount</div>
        </div>
      )}

      {/* СПИСОК ТРАНЗАКЦИЙ */}
      <div className="flex flex-col flex-1 divide-y divide-gray-100 dark:divide-white/[0.04] overflow-x-auto">
        {transactions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 px-5 text-center">
            <div className="w-12 h-12 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search className="text-gray-400 dark:text-gray-500" size={20} strokeWidth={1.5} />
            </div>
            <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
              No transactions found
            </h4>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-[250px]">
              We couldn't find any records matching your current filters or search query.
            </p>
          </motion.div>
        ) : (
          transactions.map((tx, idx) => {
            const isIncome = tx.type === 'Income';
            const Icon = isIncome ? ArrowDownRight : ArrowUpRight;
            
            // Симуляция метаданных для реализма (в реальном приложении это приходит с бекенда)
            const isRecurring = ['Housing', 'Software', 'Subscriptions'].includes(tx.category);
            const isPending = new Date(tx.date).getTime() > Date.now() - 43200000; // < 12 часов назад
            const paymentMethod = isIncome ? 'Bank Transfer' : '•••• 4242';

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                className="group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-5 py-3 md:py-3.5 items-start md:items-center hover:bg-gray-50/80 dark:hover:bg-white/[0.015] transition-colors relative cursor-default"
              >
                {/* 1 КОЛОНКА: ИКОНКА И ОПИСАНИЕ (span 5/4) */}
                <div className="col-span-5 lg:col-span-4 flex items-center gap-3.5 min-w-0 w-full">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 shadow-sm transition-colors ${
                    isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight truncate">
                        {tx.description}
                      </h4>
                      {isRecurring && (
                        <Repeat size={12} className="text-gray-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[12px] text-gray-500">
                      <span className="truncate">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                      <span className="truncate">{tx.category}</span>
                    </div>
                  </div>
                </div>

                {/* 2 КОЛОНКА: ДЕТАЛИ И СТАТУС (span 3/4) - Скрыто на мобильных */}
                <div className="hidden md:flex col-span-3 lg:col-span-4 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-400">
                    <CreditCard size={13} className="opacity-70" />
                    <span className="truncate font-medium">{paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    {isPending ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">
                        <Clock size={10} /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                        <CheckCircle2 size={10} /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 КОЛОНКА: СУММА И КНОПКИ (span 4) */}
                <div className="col-span-4 flex items-center justify-between md:justify-end w-full gap-4">
                  
                  {/* Кнопки действий (Появляются при наведении) */}
                  <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={(e) => handleCopy(tx.id, e)}
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-all outline-none"
                      title="Copy ID"
                    >
                      {copiedId === tx.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all outline-none"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Сумма (Строгий табличный шрифт) */}
                  <div className="text-right shrink-0">
                    <p className={`text-[14px] font-semibold tabular-nums tracking-tight ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-950 dark:text-white'
                    }`}>
                      {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </p>
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}