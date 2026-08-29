import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { downloadCSV } from '../utils/export';
import { getMerchantIcon } from '../utils/merchantIcons';

// Используем строчные типы из нашего обновленного стора
type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
  // 1. Достаем только нужные данные из сторов (защита от лишних ререндеров)
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  
  const lang = useAppStore((state) => state.lang);
  const globalCurrency = useAppStore((state) => state.currency);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  // 2. БЕЗОПАСНОЕ ФОРМАТИРОВАНИЕ ДЕНЕГ (С try-catch)
  const formatMoneySafe = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      // Фолбэк, если пришла невалидная валюта вроде 'CRYPTO'
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  // 3. ФИЛЬТРАЦИЯ И СОРТИРОВКА (Оптимизировано)
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return transactions.filter((tx) => {
      // Проверка типа (строгие строчные буквы)
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      
      // Проверка поиска
      const matchesSearch = 
        !query || 
        tx.description.toLowerCase().includes(query) || 
        tx.category.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [transactions, searchQuery, typeFilter]);

  // 4. ГРУППИРОВКА С ПРАВИЛЬНЫМИ ЧАСОВЫМИ ПОЯСАМИ И МАТЕМАТИКОЙ
  const groupedTransactions = useMemo(() => {
    // Используем Map для сохранения порядка вставки
    const groups = new Map<string, { date: Date; items: typeof transactions; total: number }>();

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.date);
      // Защита от UTC-бага: собираем строку из локального времени (YYYY-MM-DD)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { date, items: [], total: 0 });
      }

      const group = groups.get(dateKey)!;
      group.items.push(tx);

      // Математически корректный тотал (Доход = +, Расход = -)
      // Берем Math.abs на случай, если в базу закралось отрицательное число
      const actualAmount = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      group.total += actualAmount;
    });

    // Конвертируем Map обратно в массив для рендера (уже отсортированный по датам)
    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTransactions]);

  // 5. ПОДКЛЮЧЕННЫЙ ЭКСПОРТ
  const handleExport = () => {
    // Используем функцию из utils/export.ts
    downloadCSV(filteredTransactions, { delimiter: ',' });
  };

  // Вспомогательная функция для заголовков дней
  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { 
      weekday: 'long', month: 'long', day: 'numeric' 
    });
  };

  return (
    // Убран жесткий min-h-screen, чтобы не конфликтовать с AppLayout
    <div className="w-full max-w-5xl mx-auto pb-10">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your income and expenses</p>
        </div>
        
        {/* Рабочая кнопка экспорта */}
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Панель управления (Поиск и Фильтры) */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
        
        <div className="flex bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl p-1 shrink-0">
          {(['all', 'income', 'expense'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                typeFilter === type 
                  ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Список транзакций */}
      <div className="space-y-8">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl">
            <Filter className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500">No transactions found.</p>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.date.toISOString()} className="space-y-3">
              {/* Заголовок дня с правильным цветом тотала */}
              <div className="flex justify-between items-end border-b border-gray-100 dark:border-white/5 pb-2 px-1">
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {formatDayHeader(group.date)}
                </h3>
                <span className={`text-sm font-medium ${
                  group.total > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  group.total < 0 ? 'text-rose-600 dark:text-rose-400' : 
                  'text-gray-500'
                }`}>
                  {group.total > 0 ? '+' : ''}{formatMoneySafe(group.total, globalCurrency)}
                </span>
              </div>

              {/* Транзакции внутри дня */}
              <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {group.items.map((tx, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      key={tx.id}
                      className={`flex items-center justify-between p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group ${
                        index !== group.items.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                          tx.type === 'income' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {(() => {
                            // Если удалось определить тип заведения по описанию — показываем
                            // его иконку, иначе — стрелку по направлению (доход/расход)
                            const MerchantIcon = getMerchantIcon(tx.description);
                            if (MerchantIcon) return <MerchantIcon size={20} />;
                            return tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${
                            tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{formatMoneySafe(Math.abs(tx.amount), tx.currency)}
                          </p>
                        </div>
                        
                        {/* Accessible кнопка удаления */}
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          aria-label={`Delete transaction ${tx.description}`}
                          className="p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}