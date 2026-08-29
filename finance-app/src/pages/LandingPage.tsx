import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Scan, Bot, CreditCard, ChevronRight, Menu, X } from 'lucide-react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  // Яркий, сочный оранжевый градиент для графиков и кнопок
  const brandGradient = "bg-gradient-to-r from-[#FF6B00] to-[#FF4500]";
  const brandText = "text-[#FF4500]";
  const brandBg = "bg-[#FF4500]";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Закрываем меню перед переходом на якорь/действие, иначе оно остаётся
  // открытым поверх контента после клика
  const handleMobileNavClick = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans scroll-smooth">
      
      {/* Яркий оранжевый блюр на фоне (теперь fixed, чтобы не уезжал при скролле) */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#FF4500]/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* Навигация */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${brandGradient} rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.3)]`}>
            <Sparkles className="text-white" size={16} />
          </div>
          <span className="text-xl font-bold tracking-tight">Clarity</span>
        </div>

        {/* Ссылки (теперь рабочие якоря) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#ai-assistant" className="hover:text-white transition-colors">AI Assistant</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={onStart} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Log in
          </button>
          <button 
            onClick={onStart}
            className={`px-5 py-2.5 ${brandBg} hover:bg-[#E63E00] text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_20px_rgba(255,69,0,0.4)]`}
          >
            Get started
          </button>
        </div>

        {/* Мобильное меню */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle menu"
          className="md:hidden text-gray-400 hover:text-white z-50"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Выпадающее мобильное меню */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 bg-[#0A0A0C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40"
            >
              <div className="flex flex-col p-2">
                <a href="#features" onClick={handleMobileNavClick} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  Features
                </a>
                <a href="#how-it-works" onClick={handleMobileNavClick} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  How it works
                </a>
                <a href="#ai-assistant" onClick={handleMobileNavClick} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  AI Assistant
                </a>
                <div className="h-px bg-white/10 my-2" />
                <button
                  onClick={() => { handleMobileNavClick(); onStart(); }}
                  className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  Log in
                </button>
                <button
                  onClick={() => { handleMobileNavClick(); onStart(); }}
                  className={`mt-1 px-4 py-3 ${brandBg} hover:bg-[#E63E00] text-white rounded-xl text-sm font-medium transition-colors text-center`}
                >
                  Get started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 lg:pt-24 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* ЛЕВАЯ ЧАСТЬ: Текст */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8"
            >
              <span className={`w-2 h-2 rounded-full ${brandBg} animate-pulse`}></span>
              <span className="text-gray-300">Meet the new Clarity AI</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Financial Intelligence, <br className="hidden lg:block" />
              <span className={`text-transparent bg-clip-text ${brandGradient}`}>Simplified.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Connect your accounts, get AI-driven insights, and take control of your financial future in one stunning dashboard.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button 
                onClick={onStart}
                className={`w-full sm:w-auto px-8 py-4 ${brandBg} hover:bg-[#E63E00] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(255,69,0,0.4)]`}
              >
                Get started for free
                <ArrowRight size={18} />
              </button>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-medium border border-white/10 transition-all flex items-center justify-center text-center"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ: Bento Grid (Тот самый красивый дизайн) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000"
          >
            <div className="relative w-full aspect-square md:aspect-[4/3] transform-gpu rotate-y-[-10deg] rotate-x-[5deg]">
              
              {/* Главная карточка: Баланс */}
              <div className="absolute top-0 left-0 w-[80%] bg-[#121214] border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl z-20">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
                    <h3 className="text-3xl font-bold">$12,450.00</h3>
                  </div>
                  <div className={`px-2.5 py-1 ${brandBg}/20 ${brandText} text-xs font-bold rounded-lg border border-[#FF4500]/30`}>
                    +2.4%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <CreditCard size={18} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Coffee Shop</p>
                        <p className="text-xs text-gray-500">Today</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white">-$4.50</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${brandBg}/10 flex items-center justify-center`}>
                        <ArrowRight size={18} className={brandText} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Salary</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${brandText}`}>+$4,200.00</p>
                  </div>
                </div>
              </div>

              {/* Карточка 2: График */}
              <div className="absolute bottom-0 right-0 w-[60%] bg-[#121214] border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-xl z-30">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-medium text-gray-300">Cash Flow</p>
                  <ChevronRight size={16} className="text-gray-500" />
                </div>
                <div className="flex items-end justify-between h-24 gap-2">
                  {[35, 50, 40, 80, 60, 75, 100].map((height, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                      className={`w-full rounded-t-md ${i === 6 ? brandGradient : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Карточка 3: AI Сканер (Теперь видна и не ломается) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 right-[-10%] w-[45%] bg-[#121214] border border-white/10 p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl z-40 hidden sm:block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${brandBg}/20`}>
                    <Scan size={16} className={brandText} />
                  </div>
                  <p className="text-xs font-medium text-gray-300">Scanning receipt...</p>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${brandBg} w-[65%] rounded-full shadow-[0_0_10px_rgba(255,69,0,0.5)]`}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 text-right">Categorizing as "Food"</p>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </main>

      {/* Якоря для скролла, чтобы ссылки не были "битыми" */}
      <section id="features" className="py-20"></section>
      <section id="how-it-works" className="py-20"></section>
      <section id="ai-assistant" className="py-20"></section>

      {/* Футер с динамическим годом */}
      <footer className="relative z-10 py-8 text-center text-sm text-gray-500 border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} Clarity App. All rights reserved.</p>
      </footer>
    </div>
  );
}