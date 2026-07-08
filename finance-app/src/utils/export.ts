// 1. СТРОГАЯ ТИПИЗАЦИЯ ВМЕСТО any[]
export interface Transaction {
  id?: string;
  date: string | number | Date;
  amount: number;
  type: 'income' | 'expense' | string;
  category: string;
  description?: string;
}

interface ExportOptions {
  filename?: string;
  delimiter?: string; // Полезно для европейских Excel, где нужен ';'
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
 * Возвращает объект с результатом, чтобы UI мог показать Toast вместо alert()
 */
export const downloadCSV = (
  transactions: Transaction[],
  options?: ExportOptions
): { success: boolean; message?: string } => {
  
  // 3. ОТКАЗ ОТ alert()
  if (!transactions || transactions.length === 0) {
    return { success: false, message: 'No transactions to export.' };
  }

  const delimiter = options?.delimiter || ',';
  
  // 4. ДИНАМИЧЕСКОЕ ИМЯ ФАЙЛА (С защитой от перезаписи)
  const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeSuffix = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = options?.filename || `finance_export_${dateSuffix}_${timeSuffix}.csv`;

  try {
    // Гибкие заголовки
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];

    // 5. БЕЗОПАСНЫЙ МАППИНГ ДАННЫХ
    const rows = transactions.map(tx => {
      // Стандартизированная дата ISO 8601 (YYYY-MM-DD) для консистентности в любых локалях
      let safeDate = '';
      try {
        safeDate = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';
      } catch (e) {
        safeDate = 'Invalid Date';
      }

      return [
        safeDate,
        sanitizeCSVCell(tx.type),
        sanitizeCSVCell(tx.category),
        sanitizeCSVCell(tx.amount),
        sanitizeCSVCell(tx.description)
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
    return { success: false, message: 'Failed to generate CSV file. Please try again.' };
  }
};