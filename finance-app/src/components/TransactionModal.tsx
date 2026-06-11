import { useState } from 'react';

// Interfejs dla transakcji zwracanych przez Gemini
export interface ExtractedTransaction {
  id: string;
  description: string;
  category: string;
  type: 'Income' | 'Expense';
  amount: string;
  date: string;
  currency: string; // <--- ОБЯЗАТЕЛЬНО ДОБАВИТЬ ЭТУ СТРОЧКУ
}

// Interfejs dla propsów przekazywanych z komponentu Dashboard
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => void;
  t: any;
  currency: string;
  rates: Record<string, number>;
}

export const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  t, 
  currency, 
  rates 
}: TransactionModalProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedTx, setExtractedTx] = useState<ExtractedTransaction[] | null>(null);

  // Konwersja pliku graficznego do formatu Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  // НАСТОЯЩИЙ ИИ-СКАНИРОВЩИК (Обновленная версия с определением валюты)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    try {
      const base64Image = await fileToBase64(file);
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

      // ОБНОВЛЕННЫЙ ПРОМПТ: Просим ИИ вытащить валюту (например, PLN, USD, EUR)
      const promptText = `
        Analyze this receipt or bank screenshot. Extract a list of transactions.
        Return ONLY a valid JSON array of objects. Do not use markdown blocks like \`\`\`json.
        Each object must have exactly these keys:
        - description: string (Merchant name)
        - category: string (Choose one: Food, Transport, Housing, Entertainment, Shopping, Freelance, Salary, Other)
        - type: string (Expense or Income)
        - amount: string (Just the number, positive, no currency symbols)
        - date: string (Format YYYY-MM-DD, deduce from image if possible, otherwise use today)
        - currency: string (Detect currency from image, use 3-letter ISO code like PLN, USD, EUR. If you absolutely cannot find it, return "${currency}")
      `;

      // Используем рабочую модель gemini-2.5-flash
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: file.type, data: base64Image } }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedTx = JSON.parse(rawText);

      // Маппинг транзакций с сохранением валюты и жестким приведением типа для TypeScript (as 'Income' | 'Expense')
      const newExtracted = (Array.isArray(parsedTx) ? parsedTx : [parsedTx]).map((tx: any) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
        description: tx.description || 'Unknown',
        category: tx.category || 'Other',
        type: (tx.type === 'Income' ? 'Income' : 'Expense') as 'Income' | 'Expense', 
        amount: String(tx.amount).replace(',', '.'), 
        date: tx.date || new Date().toISOString().split('T')[0],
        currency: tx.currency || currency // Сюда запишется PLN, если ИИ его найдет
      }));

      setExtractedTx(newExtracted);

    } catch (error) {
      console.error("AI Parsing Error:", error);
      alert("Failed to parse the image. Please try again or check the console.");
    } finally {
      setIsScanning(false);
    }
  };

  // Zapisanie wybranej pozycji do głównej listy w Dashboardzie
  // Сохранение распознанной транзакции
  const handleSaveScanned = (tx: ExtractedTransaction) => {
    // Передаем транзакцию целиком, вместе с той валютой, которую извлек ИИ (например, PLN)
    onSave(tx); 
    
    // Удаляем добавленный элемент из списка распознанных, чтобы строчка исчезла
    if (extractedTx) {
      const updatedList = extractedTx.filter(item => item.id !== tx.id);
      setExtractedTx(updatedList.length > 0 ? updatedList : null);
    }
  };

  // Jeśli modal jest zamknięty, nie renderujemy komponentu
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-white dark:bg-[#121214] w-full max-w-lg rounded-2xl shadow-2xl p-6 relative border border-gray-100 dark:border-white/10">
        
        {/* Przycisk zamykania modala */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
            {t?.addRecord || "Добавить транзакцию"}
          </h2>
          
          {/* Kontener sekcji skanowania dokumentów */}
          <div className="mb-6 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/20">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              ИИ-сканер чеков и скриншотов
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={isScanning}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 
                file:text-sm file:font-semibold 
                file:bg-indigo-50 file:text-indigo-600 
                hover:file:bg-indigo-100
                dark:file:bg-indigo-500/20 dark:file:text-indigo-400
                cursor-pointer disabled:cursor-not-allowed"
            />
            {isScanning && (
              <p className="mt-3 text-sm text-indigo-500 animate-pulse font-medium">
                🤖 ИИ анализирует изображение...
              </p>
            )}
          </div>

          {/* Sekcja wyświetlania rezultatów działania AI */}
          {extractedTx && extractedTx.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Распознано:</h3>
              {extractedTx.map((tx) => (
                <div key={tx.id} className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 flex justify-between items-center gap-2">
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500">{tx.category} • {tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-semibold text-sm ${tx.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {/* ВОТ ЗДЕСЬ ИСПРАВЛЕНИЕ: tx.currency вместо currency */}
                      {tx.type === 'Income' ? '+' : '-'}{tx.amount} {tx.currency}
                    </span>
                    <button 
                      onClick={() => handleSaveScanned(tx)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    );
};