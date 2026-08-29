import { useState, useMemo } from 'react';
import { Sparkles, AlertCircle, RefreshCw, ChevronRight, Info, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { convertAmount } from '../utils/currency';
import toast from 'react-hot-toast';

// 1. ЛОКАЛИЗАЦИЯ ИНСАЙТОВ
const HUB_T = {
  en: {
    title: 'Clarity AI Insights',
    refresh: 'Refresh',
    emptyTitle: 'No data for analysis',
    emptySub: 'Add transactions to unlock AI insights.',
    btnReview: 'Review',
    btnCheck: 'Check',
    topCatTitle: 'Top Spending Category',
    topCatDesc: 'Most of your expenses go to',
    largeTxTitle: 'Large Expense Detected',
    largeTxDesc: 'was unusually high this period.',
  },
  ru: {
    title: 'Clarity AI Аналитика',
    refresh: 'Обновить',
    emptyTitle: 'Нет данных для анализа',
    emptySub: 'Добавьте транзакции, чтобы ИИ смог их изучить.',
    btnReview: 'Смотреть',
    btnCheck: 'Проверить',
    topCatTitle: 'Главная статья расходов',
    topCatDesc: 'Больше всего средств уходит на',
    largeTxTitle: 'Крупное списание',
    largeTxDesc: 'выглядит необычно высоким.',
  },
  pl: {
    title: 'Analiza Clarity AI',
    refresh: 'Odśwież',
    emptyTitle: 'Brak danych do analizy',
    emptySub: 'Dodaj transakcje, aby odblokować AI.',
    btnReview: 'Przejrzyj',
    btnCheck: 'Sprawdź',
    topCatTitle: 'Główna kategoria wydatków',
    topCatDesc: 'Większość Twoich wydatków to',
    largeTxTitle: 'Duży wydatek',
    largeTxDesc: 'jest nietypowo wysoki.',
  }
};

export default function AIHub() {
  const lang = useAppStore(s => s.lang);
  const currency = useAppStore(s => s.currency);
  const transactions = useTransactionStore(s => s.transactions);
  const t = HUB_T[lang];

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. РЕАЛЬНАЯ АНАЛИТИКА (Генерация инсайтов на лету)
  const insights = useMemo(() => {
    if (transactions.length === 0) return [];

    const generated = [];
    const expenses = transactions.filter(tx => tx.type === 'expense');

    if (expenses.length > 0) {
      // Ищем самую затратную категорию (сначала переводим всё в текущую валюту,
      // иначе суммы в разных валютах складывались бы как одна и та же)
      const catTotals = expenses.reduce((acc, tx) => {
        const amountInBase = convertAmount(Math.abs(tx.amount), tx.currency, currency);
        acc[tx.category] = (acc[tx.category] || 0) + amountInBase;
        return acc;
      }, {} as Record<string, number>);

      const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
      
      generated.push({
        id: 'insight-top-cat',
        type: 'info',
        icon: Info,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10 border-blue-500/20',
        title: t.topCatTitle,
        description: `${t.topCatDesc} ${topCat[0]}.`,
        metric: `${topCat[1].toFixed(0)} ${currency}`,
        action: t.btnReview
      });

      // Ищем необычно крупные транзакции (порог тоже сравниваем в базовой валюте)
      const largeTx = expenses.find(tx => convertAmount(Math.abs(tx.amount), tx.currency, currency) > 500);
      if (largeTx) {
        const largeTxInBase = convertAmount(Math.abs(largeTx.amount), largeTx.currency, currency);
        generated.push({
          id: 'insight-large-tx',
          type: 'warning',
          icon: AlertCircle,
          color: 'text-rose-500',
          bg: 'bg-rose-500/10 border-rose-500/20',
          title: t.largeTxTitle,
          description: `${largeTx.description} ${t.largeTxDesc}`,
          metric: `-${largeTxInBase.toFixed(0)} ${currency}`,
          action: t.btnCheck
        });
      }
    }

    return generated;
  }, [transactions, currency, lang, t]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Имитация работы ИИ
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(lang === 'ru' ? 'Аналитика обновлена' : 'Insights refreshed');
    }, 1000);
  };

  const handleActionClick = (actionName: string) => {
    toast(`Action triggered: ${actionName}`, { icon: '🤖' });
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Шапка компонента */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500/10 p-1.5 rounded-lg">
            <Sparkles size={16} className="text-orange-500" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
        </div>
        
        {/* Рабочая кнопка обновления */}
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || transactions.length === 0}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
          <span className="uppercase tracking-wider">{t.refresh}</span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
        {/* 3. ЧЕСТНОЕ ПУСТОЕ СОСТОЯНИЕ (Больше не исчезаем) */}
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <BrainCircuit size={40} className="text-gray-400" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t.emptyTitle}</p>
              <p className="text-xs text-gray-500 mt-1">{t.emptySub}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={`group p-4 rounded-xl border ${insight.bg} transition-all hover:shadow-sm`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={insight.color} />
                      <h4 className={`text-sm font-bold ${insight.color}`}>{insight.title}</h4>
                    </div>
                    <span className={`text-sm font-bold ${insight.color}`}>{insight.metric}</span>
                  </div>
                  
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 pr-4 leading-relaxed">
                    {insight.description}
                  </p>
                  
                  {/* Рабочие интерактивные кнопки */}
                  <button 
                    onClick={() => handleActionClick(insight.action)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors uppercase tracking-wider"
                  >
                    <span>{insight.action}</span>
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}