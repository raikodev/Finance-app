export const downloadCSV = (transactions: any[]) => {
  if (!transactions || transactions.length === 0) {
    alert("No transactions to export!");
    return;
  }

  // Заголовки колонок
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
  
  // Формируем строки
  const csvRows = transactions.map(tx => {
    return [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.category,
      // Экранируем кавычки в описании, чтобы не сломать CSV
      `"${tx.description.replace(/"/g, '""')}"`, 
      tx.amount,
      tx.currency
    ].join(',');
  });

  // Склеиваем всё вместе
  const csvContent = [headers.join(','), ...csvRows].join('\n');
  
  // Создаем файл в памяти браузера
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Имитируем клик по невидимой ссылке для скачивания
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `finance_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};