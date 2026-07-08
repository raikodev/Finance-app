import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, TrendingUp, TrendingDown, Clock, SearchX } from 'lucide-react';
import type { Transaction } from '../store/useTransactionStore';
import { getCategoryMeta } from '../utils/categories';
import { useAppStore } from '../store/useAppStore';

// 1. ЛОКАЛИЗАЦИЯ
const LIST_T = {
  en: { 
    title: 'Recent Transactions', all: 'All', income: 'Income', expense: 'Expense', 
    empty: 'No transactions found', emptySub: 'Adjust your filters or add a new record.',
    colTx: 'Transaction', colDate: 'Date & Time', colAmount: 'Amount'
  },
  ru: { 
    title: 'Последние транзакции', all: 'Все', income: 'Доходы', expense: 'Расходы', 
    empty: 'Транзакции не найдены', emptySub: 'Измените фильтры или добавьте новую запись.',
    colTx: 'Транзакция', colDate: 'Дата и время', colAmount: 'Сумма'
  },
  pl: { 
    title: 'Ostatnie transakcje', all: 'Wszystkie', income: 'Przychody', expense: 'Wydatki', 
    empty: 'Brak transakcji', emptySub: 'Zmień filtry lub dodaj nowy wpis.',
    colTx: 'Transakcja', colDate: 'Data i czas', colAmount: 'Kwota'
  }
};

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  formatAmount: (amount: number, currency: string) => string;
  t?: any; // Оставляем для обратной совместимости пропсов из Dashboard
}

export default function TransactionList({ transactions, onDelete, formatAmount }: TransactionListProps) {
  const lang = useAppStore(s => s.lang);
  const t = LIST_T[lang];

  // 2. РАБОЧИЕ ФИЛЬТРЫ 
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  // 3. ПРАВИЛЬНОЕ ФОРМАТИРОВАНИЕ ДАТЫ
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
    return {
      date: date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Шапка и Фильтры */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-white/[0.02]">
        <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
        
        {/* Интерактивные табы */}
        <div className="flex bg-gray-200 dark:bg-[#0A0A0C] p-1 rounded-lg border border-transparent dark:border-white/5">
          {(['all', 'income', 'expense'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#1A1A1D] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Заголовки колонок (Только для Десктопа) */}
      {filteredTransactions.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A0A0C]/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5">{t.colTx}</div>
          <div className="col-span-4">{t.colDate}</div>
          <div className="col-span-3 text-right">{t.colAmount}</div>
        </div>
      )}

      {/* Список транзакций */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const meta = getCategoryMeta(tx.category);
              const isIncome = tx.type === 'income';
              const dateTime = formatDate(tx.date);
              

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  key={tx.id}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3 sm:p-4 bg-white dark:bg-[#121214] hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all"
                >
                  
                  {/* КОЛОНКА 1: Иконка, Название, Категория */}
                  <div className="col-span-1 md:col-span-5 flex items-center gap-3 sm:gap-4 overflow-hidden">
                    
                    {/* ЕДИНСТВЕННЫЙ КВАДРАТ С ИКОНКОЙ */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5 ${meta.bg} bg-opacity-10 dark:bg-opacity-10`}>
                      {(() => {
                        const Icon = meta.icon;
                        return Icon ? <Icon size={20} className={meta.color} /> : null;
                      })()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs font-medium text-gray-500 truncate mt-0.5">
                        {tx.category}
                      </p>
                    </div>
                  </div>

                  {/* КОЛОНКА 2: Дата и Время (Desktop: Grid, Mobile: Flex row) */}
                  <div className="col-span-1 md:col-span-4 flex items-center gap-2 text-gray-500 md:text-sm text-xs md:mt-0 mt-1">
                    <Clock size={14} className="shrink-0" />
                    <span className="truncate">{dateTime.date} • {dateTime.time}</span>
                  </div>

                  {/* КОЛОНКА 3: Сумма и Действия */}
                  <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                    <div className="flex items-center gap-2">
                      {isIncome ? (
                        <TrendingUp size={14} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={14} className="text-gray-400" />
                      )}
                      
                      <span className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-500' : 'text-gray-900 dark:text-white'
                      }`}>
                        {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => onDelete(tx.id)}
                      title="Delete transaction"
                      className="p-2 md:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </motion.div>
              );
            })
          ) : (
            /* ПУСТОЕ СОСТОЯНИЕ */
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-white/5">
                <SearchX size={28} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t.empty}</h3>
              <p className="text-xs text-gray-500">{t.emptySub}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}