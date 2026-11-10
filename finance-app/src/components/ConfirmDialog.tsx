import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Доступная замена `window.confirm`: alertdialog с focus-trap,
 * Escape, кликом по подложке и блокировкой прокрутки под ней.
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, isOpen, onCancel);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          data-lenis-prevent
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) onCancel();
          }}
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] p-6 shadow-2xl focus:outline-none"
          >
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 rounded-full p-2.5 ${
                  tone === 'danger'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                data-autofocus
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors cursor-pointer"
              >
                {cancelLabel ?? t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#121214] transition-colors cursor-pointer ${confirmClasses}`}
              >
                {confirmLabel ?? t('common.delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
