// ============================================================================
// RECEIPT SCANNER SERVICE
// ============================================================================
// ⚠️ ТЕКУЩЕЕ СОСТОЯНИЕ: Dev-only заглушка.
//
// Gemini API дергается напрямую с клиента с ключом из VITE_GEMINI_API_KEY.
// Префикс VITE_ означает, что ключ попадает в открытом виде в JS-бандл —
// его может вытащить кто угодно через DevTools/Network. Это НЕ проблема
// "на будущее", она есть уже сейчас в dev-сборке, поэтому:
//
//   1. В production-сборке (import.meta.env.PROD) вызов Gemini заблокирован
//      намеренно — см. throw ниже. Это защита от случайного релиза с
//      открытым ключом, а не косметика.
//   2. Когда появится бэкенд-прокси (Vercel/Netlify function, свой Express
//      и т.п.), нужно заменить ТОЛЬКО тело функции callGeminiVision —
//      сделать fetch('/api/scan-receipt', { method: 'POST', body: ... })
//      вместо прямого вызова generativelanguage.googleapis.com.
//      Сигнатура функции и всё остальное приложение менять не придётся.
// ============================================================================

export interface RawScannedTransaction {
  description?: string;
  amount?: string | number;
  currency?: string;
  category?: string;
  type?: string;
  date?: string;
}

export class ReceiptScannerDisabledError extends Error {
  constructor() {
    super(
      'Receipt scanning is disabled in this build: no backend proxy is configured, ' +
      'and calling Gemini directly from the client would expose the API key.'
    );
    this.name = 'ReceiptScannerDisabledError';
  }
}

/**
 * Отправляет изображение чека в Gemini и возвращает распарсенный JSON-массив транзакций.
 * Вся сетевая логика и извлечение JSON из ответа модели — здесь, а не в компоненте.
 */
export async function scanReceiptImage(
  file: File,
  base64Image: string
): Promise<RawScannedTransaction[]> {
  // Жёсткий стоп в production-сборке. Не дать ключу утечь в реальном релизе,
  // даже если про это забудут перед деплоем.
  if (import.meta.env.PROD) {
    throw new ReceiptScannerDisabledError();
  }

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      '[receiptScanner] Calling Gemini directly from the client with an exposed API key. ' +
      'This is fine for local dev only — never ship this path to production.'
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const promptText = `
    Analyze this receipt or bank screenshot. Extract all transactions.
    Current date context: ${today}.
    Return ONLY a raw JSON array of objects without markdown formatting or code blocks.
    Each object MUST have exact keys:
    - description: string (Item or merchant name)
    - amount: number (Absolute POSITIVE float value only)
    - currency: string (3-letter code, e.g. USD, EUR, PLN)
    - category: string (MUST BE EXACTLY ONE OF: Food, Housing, Transport, Software, Subscriptions, Shopping, Salary, Freelance)
    - type: string (MUST BE EXACTLY: 'expense' or 'income')
    - date: string (Extract date from receipt in YYYY-MM-DD format. If no date is visible, use ${today})
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inlineData: { mimeType: file.type, data: base64Image } }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Empty response from AI');
  }

  const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonStr);
  } catch {
    throw new Error('AI_PARSE_ERROR');
  }

  return Array.isArray(parsed) ? parsed : [parsed as RawScannedTransaction];
}
