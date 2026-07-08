import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';

// 1. СЛОВАРИ И ПЕРЕВОДЫ (Локализация)
const DICTIONARY = {
  en: {
    placeholder: 'Ask about your finances...',
    greeting: 'Hello! I am Clarity AI. Ask me about your spending, income, or specific categories like "food" or "transport".',
    typing: 'Clarity AI is thinking...',
    clearChat: 'Clear chat',
    fallback: 'I can analyze your total expenses, income, or specific categories. Try asking: "How much did I spend on food?"',
    respExpense: 'Your total expenses amount to',
    respIncome: 'Your total income is',
    respCategory: 'Your expenses for'
  },
  ru: {
    placeholder: 'Спросите о ваших финансах...',
    greeting: 'Привет! Я Clarity AI. Спросите меня о расходах, доходах или конкретных категориях, например "еда" или "транспорт".',
    typing: 'Clarity AI анализирует...',
    clearChat: 'Очистить чат',
    fallback: 'Я могу проанализировать ваши расходы, доходы или конкретные категории. Спросите: "Сколько я потратил на еду?"',
    respExpense: 'Сумма ваших расходов составляет',
    respIncome: 'Сумма ваших доходов составляет',
    respCategory: 'Ваши расходы на'
  },
  pl: {
    placeholder: 'Zapytaj o swoje finanse...',
    greeting: 'Cześć! Jestem Clarity AI. Zapytaj mnie o wydatki, dochody lub konkretne kategorie, np. "jedzenie".',
    typing: 'Clarity AI myśli...',
    clearChat: 'Wyczyść czat',
    fallback: 'Mogę przeanalizować Twoje wydatki, dochody lub kategorie. Zapytaj: "Ile wydałem na jedzenie?"',
    respExpense: 'Suma Twoich wydatków to',
    respIncome: 'Suma Twoich dochodów to',
    respCategory: 'Twoje wydatki na'
  }
};

export default function AIHub() {
  const { lang, currency } = useAppStore();
  const t = DICTIONARY[lang];
  const transactions = useTransactionStore((state) => state.transactions);
  
  // Подключаем наш новый безопасный стор чата
  const { messages, addMessage, clearChat, isTyping, setTyping } = useChatStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоскролл вниз при новых сообщениях
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 2. БЕЗОПАСНОЕ ФОРМАТИРОВАНИЕ ВАЛЮТ
  const formatMoneySafe = (amount: number) => {
    try {
      const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  // 3. УМНЫЙ ЛОКАЛЬНЫЙ АНАЛИЗАТОР (Вместо бэкенда)
  const generateAIResponse = (query: string) => {
    const q = query.toLowerCase();
    
    // Безопасный подсчет (используем type, а не amount < 0)
    const calculateTotal = (type: 'income' | 'expense', categoryStr?: string) => {
      return transactions
        .filter(tx => tx.type === type)
        .filter(tx => categoryStr ? tx.category.toLowerCase().includes(categoryStr) : true)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    };

    // Простые паттерны для локального "ИИ"
    if (q.includes('expense') || q.includes('расход') || q.includes('wydat')) {
      return `${t.respExpense} ${formatMoneySafe(calculateTotal('expense'))}.`;
    }
    if (q.includes('income') || q.includes('доход') || q.includes('dochod') || q.includes('przych')) {
      return `${t.respIncome} ${formatMoneySafe(calculateTotal('income'))}.`;
    }
    if (q.includes('food') || q.includes('еда') || q.includes('едy') || q.includes('jedzen')) {
      return `${t.respCategory} "Food": ${formatMoneySafe(calculateTotal('expense', 'food'))}.`;
    }
    if (q.includes('transport') || q.includes('транспорт')) {
      return `${t.respCategory} "Transport": ${formatMoneySafe(calculateTotal('expense', 'transport'))}.`;
    }

    return t.fallback;
  };

  // 4. ОТПРАВКА СООБЩЕНИЯ
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    
    // Пользователь пишет
    addMessage(userText, 'user');
    setTyping(true);

    // Симуляция сетевой задержки (в реальности здесь будет fetch к API)
    // Задержка динамическая: от 600ms до 1500ms
    const delay = Math.floor(Math.random() * 900) + 600;
    
    setTimeout(() => {
      const aiReply = generateAIResponse(userText);
      addMessage(aiReply, 'ai');
      setTyping(false);
    }, delay);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Шапка чата с кнопкой очистки */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,69,0,0.3)]">
            <Sparkles className="text-white" size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Clarity AI</h3>
            <p className="text-[10px] text-gray-500 font-medium">Powered by local engine</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            title={t.clearChat}
            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Зона сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Динамическое приветствие (не хранится в localStorage) */}
        {messages.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <Bot size={16} className="text-orange-500" />
            </div>
            <div className="bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 p-3 rounded-2xl rounded-tl-sm text-sm border border-gray-200 dark:border-white/5">
              {t.greeting}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.sender === 'user' 
                  ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10' 
                  : 'bg-orange-500/10 border-orange-500/20'
              }`}>
                {msg.sender === 'user' ? (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                ) : (
                  <Bot size={16} className="text-orange-500" />
                )}
              </div>
              
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                msg.sender === 'user'
                  // Пользователь: Оранжевый фон
                  ? 'bg-orange-600 text-white rounded-tr-sm shadow-[0_5px_15px_rgba(255,69,0,0.2)]'
                  // ИИ: Темный/Светлый фон
                  : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-white/5'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Индикатор набора текста */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-gray-400 text-xs font-medium"
          >
            <Bot size={14} className="text-orange-500 animate-pulse" />
            {t.typing}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={t.placeholder}
            className="w-full bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white pl-4 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-orange-600 shadow-[0_0_10px_rgba(255,69,0,0.3)]"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}