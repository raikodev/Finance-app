// 1. СТРОГАЯ ТИПИЗАЦИЯ ВМЕСТО any[]
export interface Transaction {
  id?: string;
  date: string | number | Date;
  amount: number;
  type: 'income' | 'expense' | string;
  category: string;
  currency?: string;
  description?: string;
}

// Подписи колонок и служебные сообщения передаются снаружи, чтобы CSV
// был локализован так же, как интерфейс (а не захардкожен на английском).
export interface ExportLabels {
  date: string;
  type: string;
  category: string;
  amount: string;
  currency: string;
  description: string;
  income: string;
  expense: string;
  empty: string;
  failed: string;
}

const DEFAULT_LABELS: ExportLabels = {
  date: 'Date',
  type: 'Type',
  category: 'Category',
  amount: 'Amount',
  currency: 'Currency',
  description: 'Description',
  income: 'Income',
  expense: 'Expense',
  empty: 'No transactions to export.',
  failed: 'Failed to generate CSV file. Please try again.',
};

type Translate = (key: string) => string;

// Хелпер, чтобы страницы не дублировали сборку объекта подписей.
export const getExportLabels = (t: Translate): ExportLabels => ({
  date: t('export.date'),
  type: t('export.type'),
  category: t('export.category'),
  amount: t('export.amount'),
  currency: t('export.currency'),
  description: t('export.description'),
  income: t('export.income'),
  expense: t('export.expense'),
  empty: t('export.empty'),
  failed: t('export.failed'),
});

export interface ExportOptions {
  filename?: string;
  delimiter?: string; // Полезно для европейских Excel, где нужен ';'
  labels?: Partial<ExportLabels>;
}

/**
 * 2. САНИТАЙЗИНГ И ЗАЩИТА ОТ CSV INJECTION
 * Очищает ячейку от макросов и правильно экранирует кавычки/запятые
 */
const sanitizeCSVCell = (val: string | number | undefined | null): string => {
  if (val === null || val === undefined) return '';
  let strVal = String(val);

  // ЗАЩИТА ОТ FORMULA INJECTION: Блокируем исполнение кода в Excel
  if (/^[=+\-@\t\r]/.test(strVal)) {
    strVal = "'" + strVal; // Добавление апострофа превращает формулу в обычный текст
  }

  // ПРАВИЛЬНОЕ ЭКРАНИРОВАНИЕ (RFC 4180): 
  // Если есть кавычки, запятые, точки с запятой или переносы строк — оборачиваем в двойные кавычки
  if (/[",;\n\r]/.test(strVal)) {
    strVal = `"${strVal.replace(/"/g, '""')}"`;
  }

  return strVal;
};

/**
 * Главная функция экспорта
 * Возвращает код ошибки вместо текста, чтобы UI перевёл сообщение сам.
 */
export const downloadCSV = (
  transactions: Transaction[],
  options?: ExportOptions
): { success: boolean; error?: 'empty' | 'failed' } => {
  const labels: ExportLabels = { ...DEFAULT_LABELS, ...options?.labels };

  // 3. ОТКАЗ ОТ alert()
  if (!transactions || transactions.length === 0) {
    return { success: false, error: 'empty' };
  }

  const delimiter = options?.delimiter || ',';

  // 4. ДИНАМИЧЕСКОЕ ИМЯ ФАЙЛА (С защитой от перезаписи)
  const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeSuffix = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = options?.filename || `finance_export_${dateSuffix}_${timeSuffix}.csv`;

  try {
    // Гибкие заголовки (уже локализованные)
    const headers = [
      labels.date,
      labels.type,
      labels.category,
      labels.amount,
      labels.currency,
      labels.description,
    ];

    // 5. БЕЗОПАСНЫЙ МАППИНГ ДАННЫХ
    const rows = transactions.map(tx => {
      // Стандартизированная дата ISO 8601 (YYYY-MM-DD) для консистентности в любых локалях
      let safeDate: string;
      try {
        safeDate = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';
      } catch {
        safeDate = 'Invalid Date';
      }

      const typeLabel = tx.type === 'income'
        ? labels.income
        : tx.type === 'expense'
          ? labels.expense
          : tx.type;

      return [
        safeDate,
        sanitizeCSVCell(typeLabel),
        sanitizeCSVCell(tx.category),
        sanitizeCSVCell(tx.amount),
        sanitizeCSVCell(tx.currency),
        sanitizeCSVCell(tx.description),
      ].join(delimiter);
    });

    const csvContent = [headers.join(delimiter), ...rows].join('\n');

    // 6. ДОБАВЛЕНИЕ BOM (\uFEFF) ДЛЯ UTF-8 (Фикс кириллицы в Excel)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 7. ЗАЩИТА ПАМЯТИ И DOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    // В современных браузерах не нужно добавлять <a> в DOM для клика
    link.click();

    // Очистка памяти для предотвращения утечек (Memory Leak)
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true };
  } catch (error) {
    console.error('CSV Export Error:', error);
    return { success: false, error: 'failed' };
  }
};
