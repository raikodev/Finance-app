import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Plus, X, Check, ArrowDownRight, ArrowUpRight, Pipette, AlertCircle, Trash2,
} from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  getCategoryMeta, getCategoryLabel, getContrastColor,
  CUSTOM_CATEGORY_COLORS, PICKER_COLOR_KEYS, CATEGORY_ICONS, PICKER_ICON_KEYS,
} from '../utils/categories';
import { convertAmount as sharedConvertAmount } from '../utils/currency';
import { removeBudgetsForCategory } from '../utils/userBudgets';
import { useExchangeRatesStore } from '../store/useExchangeRatesStore';
import { useCategoryStore, BUILTIN_CATEGORY_NAMES, MAX_CATEGORY_NAME_LENGTH,
  type CategoryType, type AddCategoryResult,
} from '../store/useCategoryStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useFocusTrap } from '../hooks/useFocusTrap';

const DEFAULT_COLOR = 'violet';
const DEFAULT_ICON = 'folder';
const DEFAULT_CUSTOM_HEX = '#8b5cf6';

// Прозрачный фон (10%) из hex — чтобы один и тот же цвет работал и для пресетов, и для своих hex
const withAlpha = (hex: string, alpha = '1a') => `${hex}${alpha}`;

export default function CategoriesPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const liveRates = useExchangeRatesStore(s => s.rates);
  const { lang, currency } = useAppStore();
  const convertAmount = useCallback(
    (amount: number, fromCur: string, toCur: string) =>
      sharedConvertAmount(amount, fromCur, toCur, liveRates),
    [liveRates]
  );
  const { t } = useTranslation();

  // Строгие типы, совпадающие с useTransactionStore
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const addCategory = useCategoryStore(s => s.addCategory);
  const removeCategory = useCategoryStore(s => s.removeCategory);
  const customCategories = useCategoryStore(s => s.customCategories);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<string>(DEFAULT_COLOR);
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>(DEFAULT_ICON);
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM_HEX);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');

  const closeAddModal = useCallback(() => setIsAddOpen(false), []);

  // Focus-trap сам обрабатывает Escape и возвращает фокус на кнопку-триггер.
  useFocusTrap(addModalRef, isAddOpen, closeAddModal);

  // Пока модалка открыта — блокируем прокрутку страницы под ней.
  // Сама модалка скроллится нативно (data-lenis-prevent), иначе Lenis
  // перехватывает колесо мыши и прокрутка внутри окна не работает.
  useEffect(() => {
    if (!isAddOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAddOpen]);

  // 3. ЕДИНЫЙ ФОРМАТ ДЕНЕГ (Синхронизирован с TransactionsPage: 2 знака после запятой)
  const formatMoneySafe = (amount: number) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  // 4. БЕЗОПАСНАЯ АНАЛИТИКА ДАННЫХ
  const categoryStats = useMemo(() => {
    // Фильтруем по строгому типу ('income' | 'expense')
    const filtered = transactions.filter(tx => tx.type === activeTab);

    const stats: Record<string, { total: number; count: number }> = {};
    let totalSum = 0;

    filtered.forEach(tx => {
      // Защита: берем сумму по модулю, чтобы отрицательные расходы не ломали математику,
      // и переводим в текущую валюту, иначе транзакции в разных валютах сложились бы
      // как одна и та же сумма
      const amount = convertAmount(Math.abs(tx.amount), tx.currency, currency);
      if (!stats[tx.category]) {
        stats[tx.category] = { total: 0, count: 0 };
      }
      stats[tx.category].total += amount;
      stats[tx.category].count += 1;
      totalSum += amount;
    });

    // Пользовательские категории нужного типа показываем даже без транзакций,
    // иначе только что созданная категория "исчезает" из интерфейса
    customCategories.forEach(cat => {
      const catType = cat.type || 'expense';
      if (catType !== activeTab) return;
      if (!stats[cat.name]) stats[cat.name] = { total: 0, count: 0 };
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        // Математическая защита от 0/0 (NaN) и Infinity
        percentage: totalSum > 0 ? (data.total / totalSum) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Зависимости включают lang и currency, чтобы UI обновлялся при их смене!
  }, [transactions, activeTab, currency, convertAmount, customCategories]);

  const openAddModal = () => {
    setNewCategoryName('');
    setNewCategoryColor(DEFAULT_COLOR);
    setNewCategoryIcon(DEFAULT_ICON);
    setNewCategoryType(activeTab);
    setCustomHex(DEFAULT_CUSTOM_HEX);
    setTouched(false);
    setServerError('');
    setIsAddOpen(true);
  };

  const handleDeleteCategory = (name: string) => {
    setCategoryToDelete(name);
  };
  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const label = getCategoryLabel(t, categoryToDelete);

    if (removeCategory(categoryToDelete)) {
      // Каскад: бюджет по удалённой категории больше не к чему привязать,
      // поэтому удаляем его вместе с категорией. Транзакции остаются в истории.
      removeBudgetsForCategory(categoryToDelete);
      toast.success(t('categories.deleteSuccess', { name: label }));
    }

    setCategoryToDelete(null);
  };

  // --- Валидация имени ---
  const trimmedName = newCategoryName.trim();
  const isCustomColor = newCategoryColor.startsWith('#');
  const activeHex = isCustomColor
    ? newCategoryColor
    : CUSTOM_CATEGORY_COLORS[newCategoryColor]?.hex || DEFAULT_CUSTOM_HEX;
  const lowerName = trimmedName.toLowerCase();
  const isDuplicate = trimmedName.length > 0 && (
    BUILTIN_CATEGORY_NAMES.includes(lowerName) ||
    customCategories.some(c => c.name.toLowerCase() === lowerName)
  );
  const isTooLong = trimmedName.length > MAX_CATEGORY_NAME_LENGTH;
  const nameError = trimmedName.length === 0
    ? (touched ? t('categories.required') : '')
    : isTooLong
      ? t('categories.nameTooLong', { max: MAX_CATEGORY_NAME_LENGTH })
      : isDuplicate
        ? t('categories.nameDuplicate')
        : serverError;
  const canSubmit = trimmedName.length > 0 && !isTooLong && !isDuplicate;

  const ActiveIcon = CATEGORY_ICONS[newCategoryIcon] || CATEGORY_ICONS.folder;
  const typeLabel = newCategoryType === 'expense'
    ? t('categories.tabExpense')
    : t('categories.tabIncome');

  const handleSubmitCategory = () => {
    setTouched(true);
    setServerError('');
    if (!canSubmit) return;

    const result: AddCategoryResult = addCategory(
      trimmedName,
      newCategoryColor,
      newCategoryIcon,
      newCategoryType,
    );

    if (result === 'ok') {
      toast.success(t('categories.addSuccess', { name: trimmedName }));
      setActiveTab(newCategoryType);
      setIsAddOpen(false);
      return;
    }

    setServerError(
      result === 'tooLong'
        ? t('categories.nameTooLong', { max: MAX_CATEGORY_NAME_LENGTH })
        : result === 'duplicate'
          ? t('categories.nameDuplicate')
          : t('categories.required'),
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 space-y-8">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('categories.title')}</h1>
          <p className="text-gray-500 text-sm">{t('categories.subtitle')}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t('categories.btnAdd')}</span>
        </button>
      </div>

      {/* Табы */}
      <div className="flex bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl p-1 w-full max-w-md">
        {(['expense', 'income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'expense' ? t('categories.tabExpense') : t('categories.tabIncome')}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {categoryStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <PieChart size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('categories.noData')}</h3>
            <p className="text-gray-500 max-w-sm">{t('categories.noDataDesc')}</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {categoryStats.map((cat, index) => {
                const meta = getCategoryMeta(cat.name);
                const isCustom = customCategories.some(
                  c => c.name.toLowerCase() === cat.name.toLowerCase()
                );
                const label = getCategoryLabel(t, cat.name);
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={cat.name} 
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2.5 rounded-xl"
                          style={{ backgroundColor: withAlpha(meta.hex) }}
                        >
                          <meta.icon size={20} style={{ color: meta.hex }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                          <p className="text-xs text-gray-500">
                            {t('categories.records', { count: cat.count })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formatMoneySafe(cat.total)}
                          </p>
                          <p className="text-xs font-medium text-gray-500">
                            {cat.percentage.toFixed(1)}%
                          </p>
                        </div>
                        {isCustom && (
                          <button
                            onClick={() => handleDeleteCategory(cat.name)}
                            aria-label={t('categories.deleteAria', { name: label })}
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Прогресс-бар в цвете категории (работает и для своих hex-цветов) */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: meta.hex }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Модалка создания категории */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              ref={addModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-category-title"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              data-lenis-prevent
              className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto custom-scrollbar focus:outline-none"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 id="add-category-title" className="text-lg font-bold text-gray-900 dark:text-white">{t('categories.modalTitle')}</h2>
                <button
                  onClick={closeAddModal}
                  aria-label={t('categories.btnCancel')}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Тип категории */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('categories.typeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setNewCategoryType('expense')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                    newCategoryType === 'expense'
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400'
                      : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <ArrowDownRight size={15} />
                  {t('categories.tabExpense')}
                </button>
                <button
                  type="button"
                  onClick={() => setNewCategoryType('income')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                    newCategoryType === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <ArrowUpRight size={15} />
                  {t('categories.tabIncome')}
                </button>
              </div>

              {/* Имя */}
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="category-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('categories.nameLabel')} <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] tabular-nums ${isTooLong ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {trimmedName.length}/{MAX_CATEGORY_NAME_LENGTH}
                </span>
              </div>
              <input
                id="category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setServerError('');
                }}
                onBlur={() => setTouched(true)}
                placeholder={t('categories.namePlaceholder')}
                maxLength={MAX_CATEGORY_NAME_LENGTH}
                autoFocus
                aria-invalid={Boolean(nameError)}
                className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0C] border rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  nameError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-gray-300 dark:border-white/20 focus:ring-orange-500 focus:border-orange-500'
                }`}
              />
              {nameError && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle size={12} />
                  {nameError}
                </p>
              )}

              {/* Иконка */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                {t('categories.iconLabel')}
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {PICKER_ICON_KEYS.map((key) => {
                  const Icon = CATEGORY_ICONS[key];
                  const isSelected = newCategoryIcon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewCategoryIcon(key)}
                      aria-label={key}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-center h-8 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>

              {/* Цвет */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                {t('categories.colorLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PICKER_COLOR_KEYS.map((key) => {
                  const preset = CUSTOM_CATEGORY_COLORS[key];
                  const isSelected = newCategoryColor === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewCategoryColor(key)}
                      aria-label={key}
                      aria-pressed={isSelected}
                      style={{ backgroundColor: preset.hex }}
                      className={`flex items-center justify-center h-7 rounded-full transition-transform cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-[#121214]'
                          : 'hover:scale-110'
                      }`}
                    >
                      {isSelected && (
                        <Check size={14} strokeWidth={3} style={{ color: getContrastColor(preset.hex) }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Свой цвет */}
              <div className="flex items-center gap-2.5 mt-3">
                <label
                  className={`relative flex items-center justify-center w-7 h-7 rounded-full cursor-pointer ${
                    isCustomColor
                      ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-[#121214]'
                      : 'border border-gray-300 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: customHex }}
                >
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setNewCategoryColor(e.target.value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={t('categories.customColor')}
                  />
                  {isCustomColor
                    ? <Check size={14} strokeWidth={3} style={{ color: getContrastColor(customHex) }} />
                    : <Pipette size={13} className="text-white drop-shadow" />}
                </label>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('categories.customColor')}</span>
                <span className="text-[11px] font-mono text-gray-500 dark:text-gray-500 ml-auto">
                  {customHex.toUpperCase()}
                </span>
              </div>

              {/* Предпросмотр */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                {t('categories.preview')}
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                  style={{ backgroundColor: withAlpha(activeHex, '26') }}
                >
                  <ActiveIcon size={22} style={{ color: activeHex }} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${trimmedName ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {trimmedName || t('categories.previewPlaceholder')}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {newCategoryType === 'expense' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                    {typeLabel}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeAddModal}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  {t('categories.btnCancel')}
                </button>
                <button
                  onClick={handleSubmitCategory}
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/40 disabled:hover:bg-orange-600/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {t('categories.btnCreate')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={categoryToDelete !== null}
        title={t('common.confirmTitle')}
        description={
          categoryToDelete
            ? t('categories.deleteConfirm', { name: getCategoryLabel(t, categoryToDelete) })
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
