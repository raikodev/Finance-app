import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadCSV, getExportLabels, type ExportLabels } from './export';

const labels: ExportLabels = {
  date: 'Дата',
  type: 'Тип',
  category: 'Категория',
  amount: 'Сумма',
  currency: 'Валюта',
  description: 'Описание',
  income: 'Доход',
  expense: 'Расход',
  empty: 'Нет данных',
  failed: 'Ошибка',
};

let capturedBlob: Blob | null = null;
let clicked = 0;

beforeEach(() => {
  capturedBlob = null;
  clicked = 0;

  vi.stubGlobal('document', {
    createElement: () => ({
      href: '',
      setAttribute: vi.fn(),
      click: () => { clicked += 1; },
    }),
  });

  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      capturedBlob = blob;
      return 'blob:test';
    },
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('downloadCSV', () => {
  it('возвращает код empty и ничего не скачивает для пустого списка', () => {
    const result = downloadCSV([], { labels });

    expect(result).toEqual({ success: false, error: 'empty' });
    expect(capturedBlob).toBeNull();
    expect(clicked).toBe(0);
  });

  it('пишет локализованные заголовки, колонку валюты и тип', async () => {
    const result = downloadCSV([
      {
        date: '2026-01-02T12:00:00.000Z',
        amount: 10,
        type: 'income',
        category: 'Food',
        currency: 'EUR',
        description: 'Salary',
      },
    ], { labels });

    expect(result).toEqual({ success: true });
    expect(clicked).toBe(1);

    const buffer = new Uint8Array(await capturedBlob!.arrayBuffer());
    expect(Array.from(buffer.slice(0, 3))).toEqual([0xEF, 0xBB, 0xBF]); // BOM для Excel

    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Дата,Тип,Категория,Сумма,Валюта,Описание');
    expect(lines[1]).toBe('2026-01-02,Доход,Food,10,EUR,Salary');
  });

  it('экранирует запятые и кавычки по RFC 4180', async () => {
    downloadCSV([
      {
        date: '2026-01-02',
        amount: 5,
        type: 'expense',
        category: 'Food, dining',
        currency: 'USD',
        description: 'He said "hi"',
      },
    ], { labels });

    const text = await capturedBlob!.text();
    expect(text).toContain('"Food, dining"');
    expect(text).toContain('"He said ""hi"""');
  });

  it('защищает от CSV-инъекций в Excel', async () => {
    downloadCSV([
      {
        date: '2026-01-02',
        amount: 1,
        type: 'expense',
        category: 'Food',
        currency: 'USD',
        description: '=1+1',
      },
    ], { labels });

    const text = await capturedBlob!.text();
    expect(text).toContain("'=1+1");
  });
});

describe('getExportLabels', () => {
  it('собирает подписи из переводов по ключам', () => {
    const t = (key: string) => `x:${key}`;
    const result = getExportLabels(t);

    expect(result.currency).toBe('x:export.currency');
    expect(result.expense).toBe('x:export.expense');
  });
});
