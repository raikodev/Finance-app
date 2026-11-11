import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Bot, Plus, AlertCircle, Loader2, CheckCircle2, PenLine, ScanLine } from 'lucide-react';
import { useAppStore, type AppCurrency } from '../store/useAppStore';
import type { TransactionType, Transaction } from '../store/useTransactionStore';
import { scanReceiptImage, ReceiptScannerDisabledError, type RawScannedTransaction } from '../services/receiptScanner';
import CustomDatePicker from './CustomDatePicker';
import CurrencySelect from './CurrencySelect';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { parseMoneyString } from '../utils/money.ts';
import { isSupportedCurrency, SUPPORTED_CURRENCIES } from '../utils/currency';
import { getCategoryLabel } from '../utils/categories';
import { useCategoryStore } from '../store/useCategoryStore';
import { useFocusTrap } from '../hooks/useFocusTrap';

const VALID_CATEGORIES = ['Food', 'Housing', 'Transport', 'Software', 'Subscriptions', 'Shopping', 'Salary', 'Freelance'] as const;
type TransactionCategory = typeof VALID_CATEGORIES[number];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
}

export const TransactionModal = ({ isOpen, onClose, onSave }: TransactionModalProps) => {
  const appCurrency = useAppStore(s => s.currency);
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen, onClose);

  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');

  // --- Состояние AI-сканера ---
  const [isScanning, setIsScanning] = useState(false);
  const [extractedTxs, setExtractedTxs] = useState<Array<Omit<Transaction, 'id'>>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Состояние формы ручного ввода ---
  const [manualType, setManualType] = useState<TransactionType>('expense');
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState<AppCurrency>(appCurrency);
  const [manualCategory, setManualCategory] = useState<string>('Shopping');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString());

  // Пользовательские категории, отфильтрованные по типу транзакции
  const customCategories = useCategoryStore(s => s.customCategories);
  const manualCategoryOptions = useMemo(() => {
    const custom = customCategories
      .filter(c => (c.type || 'expense') === manualType)
      .map(c => c.name);
    return [...VALID_CATEGORIES, ...custom];
  }, [customCategories, manualType]);

  const resetManualForm = () => {
    setManualType('expense');
    setManualDescription('');
    setManualAmount('');
    setManualCurrency(appCurrency);
    setManualCategory('Shopping');
    setManualDate(new Date().toISOString());
  };

  // Сбрасываем состояния при каждом открытии, чтобы не тащить данные прошлой сессии.
  // Это намеренная реакция на внешний проп isOpen, поэтому правило
  // set-state-in-effect отключено осознанно (альтернатива — ремаунт модалки).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setActiveTab('scan');
      setExtractedTxs([]);
      resetManualForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Блокируем скролл заднего фона при открытой модалке
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const sanitizeDescription = (text?: string) => {
    return String(text || 'Unknown Transaction').replace(/[<>]/g, '').trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error(t('transactionModal.errSize'));
      return;
    }

    setIsScanning(true);
    setExtractedTxs([]);

    try {
      const base64Image = await fileToBase64(file);
      const txArray = await scanReceiptImage(file, base64Image);

      const safeTxs = txArray.map((tx: RawScannedTransaction): Omit<Transaction, 'id'> => {
        const rawAmount = parseMoneyString(String(tx.amount));
        const safeAmount = isNaN(rawAmount) ? 0 : Math.abs(rawAmount);

        const safeCategory: TransactionCategory = (VALID_CATEGORIES as readonly string[]).includes(tx.category ?? '')
          ? (tx.category as TransactionCategory)
          : (tx.type === 'income' ? 'Salary' : 'Shopping');

        // Валюта, которую распознал ИИ, может не входить в поддерживаемый список
        // (например, BYN). Такая транзакция помечается needsReview и не сохраняется,
        // пока пользователь сам не выберет правильную валюту.
        const rawCurrency = (tx.currency || 'USD').toUpperCase().substring(0, 3);
        const currencyRecognized = isSupportedCurrency(rawCurrency);

        let safeDate = new Date().toISOString();
        if (tx.date) {
          const parsedDate = new Date(tx.date);
          if (!isNaN(parsedDate.getTime())) {
            safeDate = parsedDate.toISOString();
          }
        }

        return {
          description: sanitizeDescription(tx.description),
          amount: safeAmount,
          currency: currencyRecognized ? rawCurrency : appCurrency,
          category: safeCategory,
          type: (tx.type === 'income' ? 'income' : 'expense') as TransactionType,
          date: safeDate,
          needsReview: !currencyRecognized,
          rawCurrency: currencyRecognized ? undefined : rawCurrency,
        };
      });

      setExtractedTxs(safeTxs);
      toast.success(t('transactionModal.scanSuccess'));
    } catch (error) {
      if (error instanceof ReceiptScannerDisabledError) {
        toast.error(t('transactionModal.scannerDisabled'));
      } else if (error instanceof Error && error.message === 'AI_PARSE_ERROR') {
        toast.error(t('transactionModal.errParse'));
      } else {
        // Текст ошибки может прийти с сервера на английском — показываем локализованный вариант
        toast.error(t('transactionModal.errParse'));
      }
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Пользователь выбрал валюту для транзакции с нераспознанной валютой
  const fixCurrency = (idx: number, currency: AppCurrency) => {
    setExtractedTxs(prev =>
      prev.map((tx, i) =>
        i === idx ? { ...tx, currency, needsReview: false, rawCurrency: undefined } : tx
      )
    );
  };

  const hasUnresolved = extractedTxs.some(tx => tx.needsReview);

  const handleSaveAll = () => {
    if (hasUnresolved) return;
    extractedTxs.forEach((tx) => {
      // Явно собираем поля транзакции — служебные needsReview/rawCurrency не сохраняем
      onSave({
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        category: tx.category,
        type: tx.type,
        date: tx.date,
      });
    });
    setExtractedTxs([]);
    onClose();
    toast.success(t('transactionModal.savedAll'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rawAmount = parseMoneyString(manualAmount);
    const safeDescription = sanitizeDescription(manualDescription);

    if (!manualDescription.trim() || isNaN(rawAmount) || rawAmount <= 0) {
      toast.error(t('transactionModal.errRequired'));
      return;
    }

    onSave({
      description: safeDescription,
      amount: Math.abs(rawAmount),
      currency: manualCurrency,
      category: manualCategory,
      type: manualType,
      date: manualDate,
    });

    resetManualForm();
    onClose();
    toast.success(t('transactionModal.savedOne'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="transaction-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col focus:outline-none"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#0A0A0C] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Bot className="text-orange-500" size={20} />
                </div>
                <h2 id="transaction-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">{t('transactionModal.title')}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Переключатель вкладок */}
            <div className="flex gap-1 p-1.5 mx-6 mt-4 bg-gray-100 dark:bg-white/5 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'scan' ? 'bg-orange-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ScanLine size={15} />
                {t('transactionModal.tabScan')}
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'manual' ? 'bg-orange-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <PenLine size={15} />
                {t('transactionModal.tabManual')}
              </button>
            </div>

            {/* Контент: вычитаем из 90vh высоту шапки, табов и кнопки */}
            <div
              data-lenis-prevent
              className="p-6 overflow-y-auto custom-scrollbar space-y-6"
              style={{ maxHeight: 'calc(90vh - 220px)' }}
            >
              {activeTab === 'scan' ? (
                <>
                  {/* Warning Banner */}
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-500 text-xs font-medium">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{t('transactionModal.disclaimer')}</p>
                  </div>

                  {/* Upload Zone */}
                  <div
                    onClick={() => !isScanning && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isScanning
                        ? 'border-orange-500/30 bg-orange-500/5'
                        : 'border-gray-300 dark:border-white/10 hover:border-orange-500/50 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isScanning}
                    />
                    {isScanning ? (
                      <>
                        <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('transactionModal.analyze')}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Upload className="text-gray-400" size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('transactionModal.drag')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('transactionModal.formats')}</p>
                      </>
                    )}
                  </div>

                  {/* Extracted Data Display */}
                  {extractedTxs.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {t('transactionModal.recognized')}
                      </h3>
                      <div className="space-y-2">
                        {extractedTxs.map((tx, idx) => (
                          <div
                            key={idx}
                            className={`flex justify-between items-center gap-2 p-3 bg-gray-50 dark:bg-[#0A0A0C] border rounded-xl text-sm ${
                              tx.needsReview ? 'border-amber-500/40' : 'border-gray-200 dark:border-white/5'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{tx.description}</span>
                              <span className="text-xs text-gray-500">{getCategoryLabel(t, tx.category)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                                {tx.type === 'income' ? '+' : '-'}{tx.amount} {tx.needsReview ? '' : tx.currency}
                              </span>
                              {tx.needsReview && (
                                <select
                                  value=""
                                  onChange={(e) => fixCurrency(idx, e.target.value as AppCurrency)}
                                  className="px-2 py-1 bg-white dark:bg-[#0A0A0C] border border-amber-500/40 rounded-lg text-xs text-amber-600 dark:text-amber-500 focus:outline-none"
                                >
                                  <option value="" disabled className="bg-white dark:bg-[#121214] text-gray-900 dark:text-white">{tx.rawCurrency}?</option>
                                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c} className="bg-white dark:bg-[#121214] text-gray-900 dark:text-white">{c}</option>)}
                                </select>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                // ===================== РУЧНОЙ ВВОД =====================
                <form id="manual-tx-form" onSubmit={handleManualSubmit} className="space-y-4">
                  {/* Доход / Расход */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setManualType('expense'); setManualCategory('Shopping'); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        manualType === 'expense'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400'
                          : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      {t('transactionModal.typeExpense')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setManualType('income'); setManualCategory('Salary'); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        manualType === 'income'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      {t('transactionModal.typeIncome')}
                    </button>
                  </div>

                  {/* Описание */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('transactionModal.fieldDescription')}</label>
                    <input
                      type="text"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder={t('transactionModal.descPlaceholder')}
                      maxLength={80}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  {/* Сумма + Валюта */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('transactionModal.fieldAmount')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('transactionModal.fieldCurrency')}</label>
                      <CurrencySelect value={manualCurrency} onChange={setManualCurrency} />
                    </div>
                  </div>

                  {/* Категория */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('transactionModal.fieldCategory')}</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                    >
                      {manualCategoryOptions.map(c => <option key={c} value={c} className="bg-white dark:bg-[#121214] text-gray-900 dark:text-white">{getCategoryLabel(t, c)}</option>)}
                    </select>
                  </div>

                  {/* Дата */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('transactionModal.fieldDate')}</label>
                    <CustomDatePicker value={manualDate} onChange={setManualDate} />
                  </div>
                </form>
              )}
            </div>

            {/* Footer Action */}
            {activeTab === 'scan' && extractedTxs.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0C] shrink-0">
                <button
                  onClick={handleSaveAll}
                  disabled={hasUnresolved}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,69,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Plus size={18} />
                  {t('transactionModal.addAll')} ({extractedTxs.length})
                </button>
              </div>
            )}
            {activeTab === 'manual' && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0C] shrink-0">
                <button
                  type="submit"
                  form="manual-tx-form"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,69,0,0.3)]"
                >
                  <Plus size={18} />
                  {t('transactionModal.addManual')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};