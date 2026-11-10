import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Target, TrendingDown, X, Check, ChevronDown } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { getCategoryMeta, getCategoryLabel, EXPENSE_CATEGORIES } from '../utils/categories';
import { convertAmount as sharedConvertAmount } from '../utils/currency';
import { loadUserBudgets, saveUserBudgets, type UserBudget } from '../utils/userBudgets';
import { useExchangeRatesStore } from '../store/useExchangeRatesStore';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { TFunction } from 'i18next';
import toast from 'react-hot-toast';

type Budget = UserBudget;

const INITIAL_BUDGETS: Budget[] = [
  { id: 'budget-1', category: 'Software', limit: 300 },
  { id: 'budget-2', category: 'Transport', limit: 200 },
  { id: 'budget-3', category: 'Food', limit: 600 },
  { id: 'budget-4', category: 'Housing', limit: 1500 },
];

/* Кастомный dropdown вместо нативного <select>:
   нативный список на Windows/Chrome рисует синюю подсветку выбранного пункта
   и светлый фон в тёмной теме — не совпадает с оранжевым акцентом приложения. */
const CategorySelect = ({
  value,
  options,
  onChange,
  t,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  t: TFunction;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedMeta = getCategoryMeta(value);
  const SelectedIcon = selectedMeta.icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors cursor-pointer"
      >
        <SelectedIcon size={16} className={selectedMeta.color} />
        <span className="flex-1 text-left truncate">
          {getCategoryLabel(t, value)}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            data-lenis-prevent
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto custom-scrollbar rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl p-1"
          >
            {options.map(option => {
              const meta = getCategoryMeta(option);
              const Icon = meta.icon;
              const isSelected = option === value;

              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon size={15} style={{ color: meta.hex }} />
                    <span className="flex-1 text-left truncate">{getCategoryLabel(t, option)}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

const loadBudgets = (): Budget[] => loadUserBudgets() ?? INITIAL_BUDGETS;

export default function BudgetsPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const liveRates = useExchangeRatesStore(s => s.rates);
  const { lang, currency } = useAppStore();
  const customCategories = useCategoryStore(s => s.customCategories);
  const convertAmount = useCallback(
    (amount: number, fromCur: string, toCur: string) =>
      sharedConvertAmount(amount, fromCur, toCur, liveRates),
    [liveRates]
  );
  const { t } = useTranslation();

  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [limitInput, setLimitInput] = useState('');
  const [formError, setFormError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => {
    const custom = customCategories
      .filter(c => (c.type || 'expense') === 'expense')
      .map(c => c.name);
    return [...EXPENSE_CATEGORIES, ...custom];
  }, [customCategories]);

  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    if (!saveUserBudgets(newBudgets)) {
      toast.error(t('budgets.errSave') || 'Could not save budgets');
    }
  };

  const openCreateModal = () => {
    setLimitInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError('');
  };

  // Focus-trap обрабатывает Escape и возвращает фокус на кнопку открытия.
  useFocusTrap(modalRef, isModalOpen, closeModal);

  // Пока модалка открыта, страница под ней не прокручивается.
  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = Number.parseFloat(limitInput.replace(',', '.'));

    if (!Number.isFinite(numLimit) || numLimit <= 0) {
      setFormError(t('budgets.errInvalidLimit'));
      return;
    }

    const existing = budgets.find(
      b => b.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    const label = getCategoryLabel(t, selectedCategory);

    if (existing) {
      saveBudgets(budgets.map(b => (b.id === existing.id ? { ...b, limit: numLimit } : b)));
      toast.success(t('budgets.updateSuccess', { category: label }));
    } else {
      saveBudgets([
        ...budgets,
        { id: `budget-${Date.now()}`, category: selectedCategory, limit: numLimit },
      ]);
      toast.success(t('budgets.createSuccess', { category: label }));
    }

    closeModal();
  };

  const handleDeleteBudget = (id: string, category: string) => {
    saveBudgets(budgets.filter(b => b.id !== id));
    toast.success(t('budgets.deleteSuccess', { category: getCategoryLabel(t, category) }));
  };

  const formatMoneySafe = (amount: number, forcePositive = false) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      const value = forcePositive ? Math.abs(amount) : amount;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${amount.toFixed(0)} ${currency}`;
    }
  };

  const budgetsWithStats = useMemo(() => {
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');

    return budgets.map(budget => {
      const spent = expenseTransactions
        .filter(tx => tx.category === budget.category)
        .reduce((acc, tx) => acc + convertAmount(Math.abs(tx.amount), tx.currency, currency), 0);

      const rawPercentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const displayPercentage = Math.min(rawPercentage, 100);
      const overPercentage = rawPercentage > 100 ? Math.min(rawPercentage - 100, 100) : 0;

      const remaining = budget.limit - spent;
      const isOver = remaining < 0;

      let progressColor = 'bg-emerald-500';
      if (rawPercentage >= 75 && rawPercentage < 90) progressColor = 'bg-amber-500';
      if (rawPercentage >= 90) progressColor = 'bg-rose-500';

      return {
        ...budget,
        spent,
        remaining,
        rawPercentage,
        displayPercentage,
        overPercentage,
        isOver,
        progressColor
      };
    }).sort((a, b) => b.rawPercentage - a.rawPercentage);
  }, [transactions, currency, convertAmount, budgets]);

  const summary = useMemo(() => {
    const totalLimit = budgetsWithStats.reduce((acc, b) => acc + b.limit, 0);
    const totalSpent = budgetsWithStats.reduce((acc, b) => acc + b.spent, 0);
    return { totalLimit, totalSpent };
  }, [budgetsWithStats]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 space-y-8">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('budgets.title')}</h1>
          <p className="text-gray-500 text-sm">{t('budgets.subtitle')}</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>{t('budgets.btnCreate')}</span>
        </button>
      </div>

      {/* Обзор бюджета */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('budgets.totalBudget')}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatMoneySafe(summary.totalLimit)}
            </h3>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <Target size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('budgets.totalSpent')}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatMoneySafe(summary.totalSpent)}
            </h3>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Список бюджетов */}
      {budgetsWithStats.length === 0 ? (
        <div className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/5 p-12 text-center space-y-3">
          <p className="text-gray-500 text-sm">{t('budgets.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {budgetsWithStats.map((budget, idx) => {
            const meta = getCategoryMeta(budget.category);
            const label = getCategoryLabel(t, budget.category);
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={budget.id}
                className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-between group relative"
              >
                <button
                  onClick={() => handleDeleteBudget(budget.id, budget.category)}
                  aria-label={t('budgets.deleteAria', { category: label })}
                  className="absolute top-4 right-4 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex justify-between items-start mb-6 pr-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-white/5`} style={{ backgroundColor: `${meta.hex}1a` }}>
                      <meta.icon size={20} style={{ color: meta.hex }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
                      <p className="text-xs text-gray-500">
                        {formatMoneySafe(budget.limit)} {t('budgets.limit')}
                      </p>
                    </div>
                  </div>
                  {budget.isOver && (
                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">
                      <AlertTriangle size={12} />
                      {t('budgets.over')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className={`text-lg font-bold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatMoneySafe(budget.spent)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{t('budgets.spent')}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>
                        {budget.remaining < 0 ? '-' : ''}{formatMoneySafe(Math.abs(budget.remaining))}
                      </span>
                      <span className="text-xs text-gray-500">{t('budgets.left')}</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative mt-3 flex">
                    <div 
                      className={`h-full ${budget.progressColor} transition-all duration-1000`} 
                      style={{ width: `${budget.displayPercentage}%` }} 
                    />
                    {budget.isOver && (
                      <div 
                        className="absolute top-0 left-0 h-full bg-rose-600/50 transition-all duration-1000 animate-pulse" 
                        style={{ width: `${budget.overPercentage}%` }} 
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания бюджета */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-budget-title"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              data-lenis-prevent
              className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <h3 id="create-budget-title" className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('budgets.modalTitle')}
                </h3>
                <button
                  onClick={closeModal}
                  aria-label={t('common.cancel')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('budgets.modalCategory')}
                  </label>
                  <CategorySelect
                    value={selectedCategory}
                    options={categoryOptions}
                    onChange={(value) => {
                      setSelectedCategory(value);
                      setFormError('');
                    }}
                    t={t}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('budgets.modalLimit')} ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="500"
                    value={limitInput}
                    onChange={(e) => {
                      setLimitInput(e.target.value);
                      setFormError('');
                    }}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                      formError
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 dark:border-white/10 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />
                  {formError && (
                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{formError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    <Check size={16} />
                    <span>{t('common.save')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
