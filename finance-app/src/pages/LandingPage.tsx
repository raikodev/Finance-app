import HeroCoin3D from '../components/HeroCoin3D';
import { Hexagon, ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* Навигация (Navbar) */}
      <div className="pt-6 px-4 sm:px-6 flex justify-center">
        <nav className="flex items-center justify-between w-full max-w-6xl bg-[#13131A] px-6 py-3.5 rounded-full border border-white/5 shadow-2xl">
          
          {/* Логотип */}
          <div className="flex items-center gap-2">
            <div className="text-white">
              <Hexagon size={24} className="fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">nickel</span>
          </div>

          {/* Центральные ссылки меню */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              Products <ChevronDown size={14} className="text-gray-500" />
            </button>
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              Company <ChevronDown size={14} className="text-gray-500" />
            </button>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">For Accountants</a>
          </div>

          {/* Правый блок с кнопками */}
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={onStart} className="text-gray-300 hover:text-white transition-colors hidden sm:block">
              Log in
            </button>
            <button 
              onClick={onStart} 
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full transition-colors border border-white/5"
            >
              Get started
            </button>
          </div>
        </nav>
      </div>

      {/* Главный блок (Hero Section) */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20 flex flex-col lg:flex-row items-center relative">
        
        {/* Левая часть: Текст */}
        <div className="flex-1 w-full z-10">
          <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-6">
            Unlock growth <br />
            with every <br />
            payment
          </h1>
          
          <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
            Run payments, extend net terms <br className="hidden sm:block" />
            and automate collections compliance.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={onStart} 
              className="bg-[#FF5A1F] hover:bg-[#E04D18] text-white font-medium px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,90,31,0.3)]"
            >
              Get started
            </button>
            <button 
              className="bg-[#1A1A1A] hover:bg-[#252525] text-white font-medium px-8 py-3.5 rounded-xl transition-colors border border-white/5"
            >
              Talk to a human
            </button>
          </div>
        </div>

        {/* Правая часть: 3D Монета */}
        <div className="flex-1 w-full mt-16 lg:mt-0 flex justify-center lg:justify-end relative z-10">
          <div className="w-full max-w-lg">
            <HeroCoin3D />
          </div>
        </div>
      </main>

    </div>
  );
}