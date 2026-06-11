import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function CustomDatePicker({ value, onChange, placeholder = "Select date" }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const days = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
  }

  const handlePrevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1)); };
  const handleNextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1)); };

  const handleSelectDay = (day: number, offset: number) => {
    const selected = new Date(year, month + offset, day);
    const formatted = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const displayValue = value ? new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* КНОПКА (Инпут) */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full border rounded-md px-3 py-1.5 text-[13px] transition-all outline-none shadow-sm ${
          isOpen 
            ? 'border-indigo-500/50 ring-1 ring-indigo-500/50 bg-white dark:bg-[#121214]' 
            : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.02]'
        }`}
      >
        <span className={`font-medium ${value ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
          {displayValue}
        </span>
        <CalendarIcon size={14} className={isOpen ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'} />
      </button>

      {/* ВЫПАДАЮЩИЙ КАЛЕНДАРЬ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -4, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -4, scale: 0.98 }} 
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 w-[260px] bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] z-[100] p-3"
          >
            {/* Тонкий блик */}
            <div className="absolute inset-0 rounded-xl pointer-events-none border border-black/[0.02] dark:border-white/[0.02]" />

            {/* ШАПКА КАЛЕНДАРЯ */}
            <div className="flex justify-between items-center mb-3 relative z-10">
              <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white tracking-tight pl-1">
                {monthNames[month]} {year}
              </h4>
              <div className="flex gap-1">
                <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500">
                  <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* ДНИ НЕДЕЛИ */}
            <div className="grid grid-cols-7 mb-1 relative z-10">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">
                  {d}
                </div>
              ))}
            </div>

            {/* СЕТКА ДНЕЙ */}
            <div className="grid grid-cols-7 gap-y-1 relative z-10">
              {days.map((d, idx) => {
                const currentDateObj = new Date(year, month + d.monthOffset, d.day);
                const currentDateStr = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
                
                const isSelected = value === currentDateStr;
                const isToday = today.getFullYear() === currentDateObj.getFullYear() && 
                                today.getMonth() === currentDateObj.getMonth() && 
                                today.getDate() === currentDateObj.getDate();

                return (
                  <div key={idx} className="flex justify-center items-center h-8">
                    <button
                      type="button"
                      onClick={() => handleSelectDay(d.day, d.monthOffset)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                        ${isSelected 
                          ? 'bg-indigo-500 text-white font-semibold shadow-[0_2px_8px_rgba(99,102,241,0.4)]' 
                          : d.isCurrentMonth 
                            ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 font-medium' 
                            : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                        }
                        ${isToday && !isSelected ? 'ring-1 ring-gray-200 dark:ring-white/20 text-indigo-600 dark:text-indigo-300' : ''}
                      `}
                    >
                      {d.day}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}