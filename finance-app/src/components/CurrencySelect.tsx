import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore, type AppCurrency } from '../store/useAppStore';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

interface CurrencySelectProps {
  value: AppCurrency;
  onChange: (currency: AppCurrency) => void;
  options?: AppCurrency[];
}

const LOCALES: Record<string, string> = {
  ru: 'ru-RU',
  pl: 'pl-PL',
  en: 'en-US',
};

/**
 * Кастомный выбор валюты: нативный <select> игнорирует тему, позиционируется
 * браузером поверх модалки и не даёт искать по 30+ валютам.
 */
export default function CurrencySelect({
  value,
  onChange,
  options = SUPPORTED_CURRENCIES,
}: CurrencySelectProps) {
  const { t } = useTranslation();
  const lang = useAppStore((state) => state.lang);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const listId = useId();
  const optionId = (code: AppCurrency) => `${listId}-${code}`;

  const currencyNames = useMemo(() => {
    const names: Partial<Record<AppCurrency, string>> = {};
    try {
      const display = new Intl.DisplayNames([LOCALES[lang] ?? 'en-US'], { type: 'currency' });
      for (const code of options) names[code] = display.of(code) ?? code;
    } catch {
      // Intl.DisplayNames нет в старых браузерах — показываем только код.
      for (const code of options) names[code] = code;
    }
    return names;
  }, [lang, options]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((code) => {
      const name = currencyNames[code]?.toLowerCase() ?? '';
      return code.toLowerCase().includes(normalizedQuery) || name.includes(normalizedQuery);
    });
  }, [options, normalizedQuery, currencyNames]);

  // Открытие: курсор в поиск и прокрутка списка к текущей валюте,
  // чтобы выбранное значение было сразу видно.
  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
      const list = listRef.current;
      const selected = list?.querySelector<HTMLElement>('[data-selected="true"]');
      if (!list || !selected) return;
      const centered = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
      list.scrollTop = Math.max(0, centered);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const selectCurrency = (code: AppCurrency) => {
    onChange(code);
    setIsOpen(false);
    setQuery('');
    // Возвращаем фокус на триггер: поиск размонтируется вместе с попапом.
    triggerRef.current?.focus();
  };

  const togglePicker = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setQuery('');
    const selectedIndex = options.indexOf(value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      // Не даём Escape закрыть сразу всю модалку.
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((index) => (index + 1) % filtered.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
      return;
    }

    if (event.key === 'Enter') {
      const code = filtered[activeIndex];
      if (code) {
        event.preventDefault();
        selectCurrency(code);
      }
    }
  };

  const activeCode = filtered[activeIndex];

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePicker}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20 focus:outline-none focus:border-orange-500/50 focus-visible:ring-2 focus-visible:ring-orange-500/40 transition-colors cursor-pointer"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-1.5 w-[260px] max-w-[calc(100vw-4rem)] overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl dark:shadow-2xl dark:shadow-black/60"
          >
            <div className="relative border-b border-gray-200 dark:border-white/10 p-2">
              <Search
                size={14}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder={t('transactionModal.searchCurrency')}
                aria-label={t('transactionModal.searchCurrency')}
                aria-controls={listId}
                aria-activedescendant={activeCode ? optionId(activeCode) : undefined}
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0C] py-2 pl-8 pr-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              data-lenis-prevent
              className="max-h-56 overflow-y-auto custom-scrollbar p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-gray-500">
                  {t('transactionModal.noCurrencyResults')}
                </li>
              ) : (
                filtered.map((code, index) => {
                  const isSelected = code === value;
                  const isActive = index === activeIndex;

                  return (
                    <li key={code} id={optionId(code)}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectCurrency(code)}
                        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400'
                            : isActive
                              ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="w-10 shrink-0 text-sm font-semibold tabular-nums">{code}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {currencyNames[code] ?? code}
                        </span>
                        {isSelected && <Check size={14} className="shrink-0 text-orange-600 dark:text-orange-400" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
