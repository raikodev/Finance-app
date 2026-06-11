import { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, User, Send } from 'lucide-react';

// Подключаем наши сторы!
import { useChatStore } from '../store/useChatStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore } from '../store/useAppStore';

interface AIAssistantProps {
  lang: string;
  t: any;
}

export default function AIAssistant({ lang, t }: AIAssistantProps) {
  // 1. Берем историю чата из Zustand
  const { messages, addMessage } = useChatStore();
  
  // 2. Берем транзакции из Zustand для анализа
  const { transactions: txs } = useTransactionStore();
  
  // 3. Берем валюту из глобального стора
  const { currency } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоскролл вниз при новых сообщениях
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!input.trim()) return;
    
    // Сохраняем сообщение юзера в СТОР
    addMessage({ sender: 'user', text: input }); 
    const query = input.toLowerCase(); 
    setInput('');
    
    // Имитируем запрос к ИИ с небольшой задержкой
    setTimeout(() => {
      // Считаем расходы на лету, используя данные из стора txs
      const exp = Math.abs(txs.filter((t:any)=>t.amount<0).reduce((s:number,t:any)=>s+t.amount,0));
      const food = Math.abs(txs.filter((t:any)=>t.category==='Food' && t.amount<0).reduce((s:number,t:any)=>s+t.amount,0));
      
      let reply = lang === 'ru' ? `Сумма ваших расходов: ${exp.toFixed(2)} ${currency}. Постарайтесь оптимизировать траты!` : 
                  lang === 'pl' ? `Suma Twoich wydatków: ${exp.toFixed(2)} ${currency}. Postaraj się zoptymalizować koszty!` : 
                  `Your total expenses amount to ${exp.toFixed(2)} ${currency}. Try to optimize your spending!`;

      if (query.includes('food') || query.includes('jedzenie') || query.includes('еда') || query.includes('еду')) {
         reply = lang === 'ru' ? `На категорию "Еда" потрачено ${food.toFixed(2)} ${currency}. Может, стоит чаще готовить дома?` : 
                 lang === 'pl' ? `Wydałeś ${food.toFixed(2)} ${currency} na "Jedzenie". Może warto gotować w domu?` : 
                 `You spent ${food.toFixed(2)} ${currency} on Food. Consider cooking at home?`;
      }
      
      // Сохраняем ответ ИИ в СТОР
      addMessage({ sender: 'ai', text: reply });
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white dark:bg-[#121216] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a20] flex items-center gap-3">
         <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><Sparkles size={20} /></div>
         <div>
           <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
           <p className="text-xs text-gray-500 dark:text-gray-400">{t.sub}</p>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {messages.map((m: any, i: number) => (
            <div key={i} className={`flex items-end gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0"><Bot size={16} /></div>}
              <div className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm shadow-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-50 dark:bg-[#1a1a20] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-800'}`}>
                {m.text}
              </div>
              {m.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0"><User size={16} /></div>}
            </div>
         ))}
         <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121216] flex gap-3">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder={t.type} 
          className="flex-1 bg-gray-50 dark:bg-[#1a1a20] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:text-white transition-colors" 
        />
        <button type="submit" disabled={!input.trim()} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors">
          <Send size={16} /> 
          <span className="hidden sm:inline">{t.send}</span>
        </button>
      </form>
    </div>
  );
}