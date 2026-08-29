import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Bot, Plus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TransactionType, Transaction } from '../store/useTransactionStore';
import { scanReceiptImage, ReceiptScannerDisabledError } from '../services/receiptScanner';
import toast from 'react-hot-toast';

// Локальный словарь модалки
const MODAL_T = {
  en: { 
    title: 'Add Transaction', scan: 'AI Receipt Scanner', analyze: 'Clarity AI is analyzing image...', 
    recognized: 'Recognized Transactions:', addAll: 'Add All to Database', errSize: 'File too large (max 4MB)', 
    errParse: 'AI failed to parse the receipt.', drag: 'Click or drag image here',
    disclaimer: 'Development Mode: API key exposed. Move to backend in production!',
    scannerDisabled: 'Receipt scanning is disabled in this build until a backend proxy is set up.'
  },
  ru: { 
    title: 'Добавить транзакцию', scan: 'ИИ-Сканер чеков', analyze: 'Clarity AI анализирует...', 
    recognized: 'Распознано:', addAll: 'Добавить все в базу', errSize: 'Файл слишком большой (макс 4MB)', 
    errParse: 'ИИ не смог распознать чек.', drag: 'Нажмите или перетащите картинку',
    disclaimer: 'Режим разработки: API ключ на клиенте. Перенесите на бэкенд!',
    scannerDisabled: 'Сканирование чеков отключено в этой сборке, пока не настроен бэкенд-прокси.'
  },
  pl: { 
    title: 'Dodaj transakcję', scan: 'Skaner paragonów AI', analyze: 'Clarity AI analizuje...', 
    recognized: 'Rozpoznane transakcje:', addAll: 'Dodaj wszystkie', errSize: 'Plik zbyt duży (max 4MB)', 
    errParse: 'AI nie mogło przetworzyć obrazu.', drag: 'Kliknij lub przeciągnij zdjęcie',
    disclaimer: 'Tryb Dev: Klucz API na froncie. Przenieś na backend w produkcji!',
    scannerDisabled: 'Skanowanie paragonów jest wyłączone w tej wersji do czasu skonfigurowania backendu.'
  }
};

const VALID_CATEGORIES = ['Food', 'Housing', 'Transport', 'Software', 'Subscriptions', 'Shopping', 'Salary', 'Freelance'] as const;
type TransactionCategory = typeof VALID_CATEGORIES[number];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
}

export const TransactionModal = ({ isOpen, onClose, onSave }: TransactionModalProps) => {
  const lang = useAppStore(s => s.lang);
  const t = MODAL_T[lang];
  
  const [isScanning, setIsScanning] = useState(false);
  const [extractedTxs, setExtractedTxs] = useState<Array<Omit<Transaction, 'id'>>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Блокируем скролл заднего фона при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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

  const sanitizeDescription = (text: string) => {
    return String(text || 'Unknown Transaction').replace(/[<>]/g, '').trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error(t.errSize);
      return;
    }

    setIsScanning(true);
    setExtractedTxs([]);

    try {
      const base64Image = await fileToBase64(file);
      const txArray = await scanReceiptImage(file, base64Image);

      const safeTxs = txArray.map((tx: any) => {
        const rawAmount = parseFloat(String(tx.amount).replace(',', '.'));
        const safeAmount = isNaN(rawAmount) ? 0 : Math.abs(rawAmount);

        const safeCategory: TransactionCategory = VALID_CATEGORIES.includes(tx.category) 
          ? tx.category 
          : (tx.type === 'income' ? 'Salary' : 'Shopping');

        // Парсим дату от ИИ
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
          currency: (tx.currency || 'USD').toUpperCase().substring(0, 3),
          category: safeCategory,
          type: (tx.type === 'income' ? 'income' : 'expense') as TransactionType,
          date: safeDate, 
        };
      });

      setExtractedTxs(safeTxs);
      toast.success('Successfully scanned!');

    } catch (error: any) {
      if (error instanceof ReceiptScannerDisabledError) {
        toast.error(t.scannerDisabled);
      } else if (error?.message === 'AI_PARSE_ERROR') {
        toast.error(t.errParse);
      } else {
        toast.error(error?.message || t.errParse);
      }
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAll = () => {
    extractedTxs.forEach(tx => onSave(tx));
    setExtractedTxs([]);
    onClose();
    toast.success('Transactions saved!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* 1. БЛОКИРУЕМ "ПРОТЕКАНИЕ" СКРОЛЛА: Добавляем onWheel и onTouchMove */}
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#121214] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0A0A0C] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Bot className="text-orange-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">{t.scan}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. ЖЕСТКАЯ ВЫСОТА: Вычитаем из 90vh высоту шапки и кнопки (примерно 160px) */}
          <div 
            className="p-6 overflow-y-auto custom-scrollbar space-y-6"
            style={{ maxHeight: 'calc(90vh - 160px)' }}
          >
            
            {/* Warning Banner */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{t.disclaimer}</p>
            </div>

            {/* Upload Zone */}
            <div 
              onClick={() => !isScanning && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isScanning 
                  ? 'border-orange-500/30 bg-orange-500/5' 
                  : 'border-white/10 hover:border-orange-500/50 hover:bg-white/5'
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
                  <p className="text-sm font-medium text-white">{t.analyze}</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                  <p className="text-sm font-medium text-white">{t.drag}</p>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP (Max 4MB)</p>
                </>
              )}
            </div>

            {/* Extracted Data Display */}
            {extractedTxs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {t.recognized}
                </h3>
                <div className="space-y-2">
                  {extractedTxs.map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-[#0A0A0C] border border-white/5 rounded-xl text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-white truncate max-w-[200px]">{tx.description}</span>
                        <span className="text-xs text-gray-500">{tx.category}</span>
                      </div>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount} {tx.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Action */}
          {extractedTxs.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-[#0A0A0C] shrink-0">
              <button
                onClick={handleSaveAll}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,69,0,0.3)]"
              >
                <Plus size={18} />
                {t.addAll} ({extractedTxs.length})
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};