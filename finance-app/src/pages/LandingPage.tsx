import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Sparkles, Scan, Bot, CreditCard, ChevronRight, Menu, X,
  Wallet, PieChart, MessageSquare, ShieldCheck
} from 'lucide-react';
import dashboardShot from '../assets/screenshots/dashboard.webp';
import reportsShot from '../assets/screenshots/reports.webp';
import categoriesShot from '../assets/screenshots/categories.webp';
import aiAssistantShot from '../assets/screenshots/ai-assistant.webp';
import { getCategoryLabel } from '../utils/categories';

// Обёртка "браузерного окна" вокруг скриншота — как у большинства SaaS-лендингов:
// цветные точки сверху + сам скриншот внутри рамки с тенью
function BrowserMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121214] shadow-2xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      </div>
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
    </div>
  );
}

export default function LandingPage({ onStart }: { onStart: () => void }) {
  // Яркий, сочный оранжевый градиент для графиков и кнопок
  const brandGradient = "bg-gradient-to-r from-[#FF6B00] to-[#FF4500]";
  const brandText = "text-[#FF4500]";
  const brandBg = "bg-[#FF4500]";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

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
          <a href="#features" className="hover:text-white transition-colors">{t('landing.nav.features')}</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">{t('landing.nav.howItWorks')}</a>
          <a href="#ai-assistant" className="hover:text-white transition-colors">{t('landing.nav.aiAssistant')}</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={onStart} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            {t('landing.nav.login')}
          </button>
          <button 
            onClick={onStart}
            className={`px-5 py-2.5 ${brandBg} hover:bg-[#E63E00] text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_20px_rgba(255,69,0,0.4)]`}
          >
            {t('landing.nav.getStarted')}
          </button>
        </div>

        {/* Мобильное меню */}
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label={t('landing.nav.toggleMenu')}
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
                  {t('landing.nav.features')}
                </a>
                <a href="#how-it-works" onClick={handleMobileNavClick} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  {t('landing.nav.howItWorks')}
                </a>
                <a href="#ai-assistant" onClick={handleMobileNavClick} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  {t('landing.nav.aiAssistant')}
                </a>
                <div className="h-px bg-white/10 my-2" />
                <button
                  onClick={() => { handleMobileNavClick(); onStart(); }}
                  className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  {t('landing.nav.login')}
                </button>
                <button
                  onClick={() => { handleMobileNavClick(); onStart(); }}
                  className={`mt-1 px-4 py-3 ${brandBg} hover:bg-[#E63E00] text-white rounded-xl text-sm font-medium transition-colors text-center`}
                >
                  {t('landing.nav.getStarted')}
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
              <span className="text-gray-300">{t('landing.hero.badge')}</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              {t('landing.hero.title')} <br className="hidden lg:block" />
              <span className={`text-transparent bg-clip-text ${brandGradient}`}>{t('landing.hero.titleAccent')}</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              {t('landing.hero.subtitle')}
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
                {t('landing.hero.ctaPrimary')}
                <ArrowRight size={18} />
              </button>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-medium border border-white/10 transition-all flex items-center justify-center text-center"
              >
                {t('landing.hero.ctaSecondary')}
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
                    <p className="text-gray-400 text-sm font-medium mb-1">{t('landing.hero.totalBalance')}</p>
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
                        <p className="text-sm font-medium">{t('landing.hero.coffeeShop')}</p>
                        <p className="text-xs text-gray-500">{t('landing.hero.today')}</p>
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
                        <p className="text-sm font-medium">{t('landing.hero.salary')}</p>
                        <p className="text-xs text-gray-500">{t('landing.hero.yesterday')}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${brandText}`}>+$4,200.00</p>
                  </div>
                </div>
              </div>

              {/* Карточка 2: График */}
              <div className="absolute bottom-0 right-0 w-[60%] bg-[#121214] border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-xl z-30">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-medium text-gray-300">{t('landing.hero.cashFlow')}</p>
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
                  <p className="text-xs font-medium text-gray-300">{t('landing.hero.scanning')}</p>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${brandBg} w-[65%] rounded-full shadow-[0_0_10px_rgba(255,69,0,0.5)]`}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 text-right">
                    {t('landing.hero.categorizing', { category: getCategoryLabel(t, 'Food') })}
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </main>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className={`inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold ${brandText} mb-4`}>
            {t('landing.features.badge')}
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-gray-400 text-lg">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Список фич */}
          <div className="space-y-6 order-2 lg:order-1">
            {[
              {
                icon: Scan,
                title: t('landing.features.receiptTitle'),
                desc: t('landing.features.receiptDesc')
              },
              {
                icon: Wallet,
                title: t('landing.features.currencyTitle'),
                desc: t('landing.features.currencyDesc')
              },
              {
                icon: PieChart,
                title: t('landing.features.budgetsTitle'),
                desc: t('landing.features.budgetsDesc')
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={`shrink-0 w-11 h-11 rounded-xl ${brandBg}/10 flex items-center justify-center`}>
                  <feature.icon size={20} className={brandText} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Скриншот дашборда */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <BrowserMockup src={dashboardShot} alt={t('landing.hero.dashboardAlt')} />
          </motion.div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className={`inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold ${brandText} mb-4`}>
            {t('landing.how.badge')}
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
            {t('landing.how.title')}
          </h2>
          <p className="text-gray-400 text-lg">
            {t('landing.how.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {[
            {
              step: "01",
              title: t('landing.how.step1Title'),
              desc: t('landing.how.step1Desc')
            },
            {
              step: "02",
              title: t('landing.how.step2Title'),
              desc: t('landing.how.step2Desc')
            },
            {
              step: "03",
              title: t('landing.how.step3Title'),
              desc: t('landing.how.step3Desc')
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <span className={`text-4xl font-bold text-transparent bg-clip-text ${brandGradient} opacity-60`}>
                {item.step}
              </span>
              <h3 className="font-semibold text-white text-lg mt-3 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <BrowserMockup src={reportsShot} alt={t('landing.how.reportsAlt')} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BrowserMockup src={categoriesShot} alt={t('landing.how.categoriesAlt')} />
          </motion.div>
        </div>
      </section>

      {/* ===================== AI ASSISTANT ===================== */}
      <section id="ai-assistant" className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold ${brandText} mb-4`}>
              {t('landing.ai.badge')}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-6">
              {t('landing.ai.title')}
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              {t('landing.ai.subtitle')}
            </p>
            <div className="space-y-4">
              {[
                { icon: MessageSquare, text: t('landing.ai.point1') },
                { icon: Bot, text: t('landing.ai.point2') },
                { icon: ShieldCheck, text: t('landing.ai.point3') },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-lg ${brandBg}/10 flex items-center justify-center`}>
                    <item.icon size={16} className={brandText} />
                  </div>
                  <p className="text-sm text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <BrowserMockup src={aiAssistantShot} alt={t('landing.ai.screenshotAlt')} />
          </motion.div>
        </div>
      </section>

      {/* CTA перед футером */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <button
            onClick={onStart}
            className={`px-8 py-4 ${brandBg} hover:bg-[#E63E00] text-white rounded-2xl font-semibold inline-flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(255,69,0,0.4)]`}
          >
            {t('landing.cta.button')}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Футер с динамическим годом */}
      <footer className="relative z-10 py-8 text-center text-sm text-gray-500 border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} Clarity App. {t('landing.footer.rights')}</p>
      </footer>
    </div>
  );
}