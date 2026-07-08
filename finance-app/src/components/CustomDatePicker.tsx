import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

// 1. УНИВЕРСАЛЬНЫЙ ХУК (Конец дублированию кода)
function useClickOutside(ref: React.RefObject<any>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default function CustomDatePicker({ value, onChange, placeholder }: CustomDatePickerProps) {
  const lang = useAppStore(s => s.lang);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(popoverRef, () => setIsOpen(false));

  // 2. БЕЗОПАСНЫЙ ПАРСИНГ ДАТЫ
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  // Синхронизация при внешнем изменении
  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  // 3. АБСОЛЮТНАЯ ЛОКАЛИЗАЦИЯ (Без хардкода массивов)
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-US';
  
  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate)
    : placeholder || (lang === 'ru' ? 'Выберите дату' : lang === 'pl' ? 'Wybierz datę' : 'Select date');

  // Динамические дни недели (начиная с понедельника. 1 января 2024 был понедельником)
  const daysOfWeek = useMemo(() => 
    Array.from({ length: 7 }).map((_, i) => 
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i + 1))
    ), [locale]
  );

  // Динамические месяцы
  const months = useMemo(() => 
    Array.from({ length: 12 }).map((_, i) => 
      new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i, 1))
    ), [locale]
  );

  // Логика календаря
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const currentYear = new Date().getFullYear();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Сдвиг на понедельник

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  // 4. ИЗБАВИЛИСЬ ОТ МАГИЧЕСКОГО ЧИСЛА 42 (Динамическая сетка)
  const totalCells = Math.ceil(days.length / 7) * 7;
  const trailingDays = totalCells - days.length;

  const handleSelect = (date: Date) => {
    // 5. РЕШЕНИЕ ПРОБЛЕМЫ ЧАСОВЫХ ПОЯСОВ
    // Формируем ISO строку со временем 12:00:00 (Полдень).
    // Это гарантирует, что дата не перескочит на вчера/завтра при сдвигах UTC -11/+12
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}T12:00:00.000Z`);
    setIsOpen(false);
  };

  // Мемоизируем сегодняшний день, чтобы не пересчитывать при каждом клике
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  return (
    <div className="relative w-full sm:w-[220px]" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
      >
        <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
          {displayValue}
        </span>
        <CalendarIcon size={16} className="text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-[280px] bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] z-50 p-4 overflow-hidden"
          >
            {/* 6. БЫСТРАЯ НАВИГАЦИЯ (Появился выбор Года и Месяца!) */}
            <div className="flex justify-between items-center mb-4 px-1">
              <button 
                onClick={() => setViewDate(new Date(year, month - 1, 1))} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex gap-1 font-bold text-sm text-gray-900 dark:text-white">
                <select 
                  value={month} 
                  onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))}
                  className="bg-transparent appearance-none cursor-pointer hover:text-orange-500 outline-none capitalize"
                >
                  {months.map((m, i) => <option key={i} value={i} className="bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white">{m}</option>)}
                </select>
                <select 
                  value={year} 
                  onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))}
                  className="bg-transparent appearance-none cursor-pointer hover:text-orange-500 outline-none"
                >
                  {/* Горизонт планирования: от 10 лет назад до 5 лет вперед */}
                  {Array.from({ length: 16 }, (_, i) => currentYear - 10 + i).map(y => (
                    <option key={y} value={y} className="bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white">{y}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => setViewDate(new Date(year, month + 1, 1))} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;
                
                const isSelected = selectedDate?.getDate() === date.getDate() &&
                                   selectedDate?.getMonth() === date.getMonth() &&
                                   selectedDate?.getFullYear() === date.getFullYear();
                                   
                const isToday = date.getTime() === today;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(date)}
                    className={`
                      h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
                      ${isSelected 
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25' 
                        // 7. ЧИСТЫЙ БРЕНД (Индиго уничтожен навсегда)
                        : isToday 
                          ? 'ring-1 ring-inset ring-orange-200 dark:ring-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
              {/* Заполняем пустые клетки в конце месяца */}
              {Array.from({ length: trailingDays }).map((_, i) => (
                <div key={`trail-${i}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}