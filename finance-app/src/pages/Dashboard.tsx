import { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, Search, ChevronDown, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

import { useDashboardData } from '../hooks/useDashboardData';

import TransactionList from '../components/TransactionList';
import CustomDatePicker from '../components/CustomDatePicker';
import {TransactionModal} from '../components/TransactionModal';
import AIHub from '../components/AIHub';
import ChartsSection from '../components/ChartsSection';
import StatsGrid from '../components/StatsGrid';

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0, duration: 0.2 } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", bounce: 0, duration: 0.5 } }
};

export default function Dashboard() {
  const {
    currency, setCurrency, lang, setLang, t, rates,
    dateFilter, setDateFilter, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    searchQuery, setSearchQuery,
    filteredTxList, displayIncome, displayExpenses, displayBalance,
    trends, // <-- ВЫТАСКИВАЕМ ТРЕНДЫ ИЗ ХУКА
    pieData, areaData, aiData, formatMoneyString, addTransaction, deleteTransaction
  } = useDashboardData();

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'c' || e.key === 'C') && e.target instanceof Element && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); setIsModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsModalOpen(false); searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(target)) setIsCurrencyOpen(false);
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) setIsLangOpen(false);
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) setIsDateFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTransaction = (txData: any) => {
    let finalAmount = parseFloat(txData.amount);
    if (txData.type === 'Expense') finalAmount = -Math.abs(finalAmount);
    
    addTransaction({
      id: Date.now().toString(),
      date: txData.date || new Date().toISOString(),
      description: txData.description, 
      category: txData.category, 
      type: txData.type, 
      amount: finalAmount, 
      currency: txData.currency, 
      iconType: 'other'
    });
    
    // 👇 ВОТ ЭТУ СТРОКУ НУЖНО УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ 👇
    // setIsModalOpen(false); 
  };

  const popularFiat = Object.keys(rates);
  const filteredCurrencies = popularFiat.filter(c => c.toLowerCase().includes(currencySearch.toLowerCase())).sort();

  return (
    <div className="relative flex flex-col gap-4 w-full max-w-[1440px] mx-auto transition-colors duration-300 min-h-screen pb-12">
      
      {/* ФОНОВОЕ СВЕЧЕНИЕ */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 flex flex-col gap-4">
        
        {/* ШАПКА И ПОИСК */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-5 mb-2 relative z-[100]">
          
          <div className="flex items-center gap-6 w-full xl:w-auto">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
                {t.welcome}, Ilyar
              </h1>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t.subtitle}</p>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/[0.06] rounded-lg focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all group ml-4 w-64 shadow-sm dark:shadow-inner">
              <Search size={14} className="text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors shrink-0" />
              <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="bg-transparent border-none outline-none text-[13px] text-gray-900 dark:text-white flex-1 placeholder-gray-400 dark:placeholder-gray-600 w-full"
              />
              <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] text-[10px] font-mono font-medium text-gray-500 group-focus-within:opacity-0 transition-opacity">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap w-full xl:w-auto justify-end">
            
            {/* ЯЗЫК */}
            <div className="relative z-50" ref={langDropdownRef}>
              <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium border bg-white dark:bg-[#121214] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <Globe size={14} className={isLangOpen ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} />
                <span className="hidden sm:inline uppercase">{lang}</span>
                <ChevronDown size={12} className="text-gray-400 dark:text-gray-500" />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full mt-1 left-0 w-36 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl p-1">
                    {['en', 'ru'].map((l: any) => (
                      <button key={l} onClick={() => { setLang(l); setIsLangOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center justify-between ${lang === l ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <span className="capitalize">{l}</span>{lang === l && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ВАЛЮТА */}
            <div className="relative z-50" ref={currencyDropdownRef}>
              <button onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium border bg-white dark:bg-[#121214] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <span className="text-gray-400 dark:text-gray-500 font-normal hidden sm:inline">Base:</span> {currency} 
                <ChevronDown size={12} className="text-gray-400 dark:text-gray-500" />
              </button>
              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full mt-1 right-0 w-64 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl flex flex-col overflow-hidden">
                    <div className="p-1.5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                      <div className="flex items-center gap-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-md px-2 py-1.5">
                        <Search size={14} className="text-gray-400 dark:text-gray-500" />
                        <input type="text" placeholder={t.search} value={currencySearch} onChange={(e) => setCurrencySearch(e.target.value)} className="bg-transparent outline-none text-xs w-full text-gray-900 dark:text-white" />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {filteredCurrencies.map(c => (
                        <button key={c} onClick={() => { setCurrency(c); setIsCurrencyOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex justify-between ${currency === c ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                          <span>{c}</span>{currency === c && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* КАЛЕНДАРЬ */}
            <div className="relative z-50" ref={dateDropdownRef}>
              <button onClick={() => setIsDateFilterOpen(!isDateFilterOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium border bg-white dark:bg-[#121214] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <Calendar size={14} className={isDateFilterOpen ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} />
                <span className="hidden sm:inline">{t[dateFilter] || dateFilter}</span>
                <ChevronDown size={12} className="text-gray-400 dark:text-gray-500" />
              </button>
              <AnimatePresence>
                {isDateFilterOpen && (
                  <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full mt-1 right-0 w-56 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl p-1">
                    {['allTime', 'today', 'week', 'month', 'custom'].map((f: any) => (
                      <button key={f} onClick={() => { setDateFilter(f); if (f !== 'custom') setIsDateFilterOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex justify-between ${dateFilter === f ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        {t[f] || f}{dateFilter === f && <Check size={14} />}
                      </button>
                    ))}
                    <AnimatePresence>
                      {dateFilter === 'custom' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} 
                          className="px-1.5 py-2 mt-1 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 rounded-md flex flex-col gap-2"
                        >
                          <CustomDatePicker value={customStartDate} onChange={setCustomStartDate} placeholder="Start date" />
                          <CustomDatePicker value={customEndDate} onChange={setCustomEndDate} placeholder="End date" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden xl:block w-px h-5 bg-gray-200 dark:bg-white/10 mx-2"></div>

            {/* CTA КНОПКА */}
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm ml-auto xl:ml-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c0c0e]">
              <Plus size={16} strokeWidth={2.5} />
              <span>{t.addRecord}</span>
            </button>
          </div>
        </motion.div>

        {/* СТАТИСТИКА (ПЕРЕДАЕМ ТРЕНДЫ) */}
        <motion.div variants={itemVariants}>
          <StatsGrid 
            displayBalance={displayBalance} 
            displayIncome={displayIncome} 
            displayExpenses={displayExpenses} 
            recordCount={filteredTxList.length} 
            currency={currency} 
            formatMoneyString={formatMoneyString} 
            t={t} 
            trends={trends} // <-- ПЕРЕДАЕМ ТРЕНДЫ В СЕТКУ
          />
        </motion.div>

        {/* AI HUB */}
        <motion.div variants={itemVariants}>
          <AIHub aiData={aiData} hasTransactions={filteredTxList.length > 0} />
        </motion.div>

        {/* ГРАФИКИ */}
        <motion.div variants={itemVariants}>
          <ChartsSection pieData={pieData} areaData={areaData} displayExpenses={displayExpenses} currency={currency} formatMoneyString={formatMoneyString} t={t} />
        </motion.div>

        {/* СПИСОК ТРАНЗАКЦИЙ */}
        <motion.div variants={itemVariants}>
          <TransactionList transactions={filteredTxList} onDelete={deleteTransaction} formatAmount={(amount, cur) => formatMoneyString(Math.abs(amount), cur)} t={t} />
        </motion.div>

      </motion.div>

      {/* МОДАЛКА */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddTransaction}
        t={t} 
        currency={currency} 
        rates={rates} 
      />
    </div>
  );
}