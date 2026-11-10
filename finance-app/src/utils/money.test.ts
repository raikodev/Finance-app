import { describe, expect, it } from 'vitest';
import { fromCents, multiplyMoney, parseMoneyString, sumMoney, toCents } from './money';

describe('toCents / fromCents', () => {
  it('округляет до ближайшего цента', () => {
    expect(toCents(1.005)).toBe(101);
    expect(toCents(1.004)).toBe(100);
    expect(toCents(-1.005)).toBe(-101);
    expect(toCents(0)).toBe(0);
  });

  it('возвращает 0 на не-finite значениях', () => {
    expect(toCents(Number.NaN)).toBe(0);
    expect(toCents(Number.POSITIVE_INFINITY)).toBe(0);
    expect(fromCents(Number.NaN)).toBe(0);
  });

  it('обратная операция восстанавливает сумму', () => {
    expect(fromCents(toCents(19.99))).toBe(19.99);
  });
});

describe('sumMoney', () => {
  it('устраняет float-дрифт при сложении', () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([0.1, 0.2, 0.3, 0.4])).toBe(1);
  });

  it('возвращает 0 для пустого списка', () => {
    expect(sumMoney([])).toBe(0);
  });
});

describe('multiplyMoney', () => {
  it('умножает через центы', () => {
    expect(multiplyMoney(19.99, 2)).toBe(39.98);
    expect(multiplyMoney(1.005, 1)).toBe(1.01);
  });

  it('возвращает 0 при не-finite коэффициенте', () => {
    expect(multiplyMoney(100, Number.NaN)).toBe(0);
  });
});

describe('parseMoneyString', () => {
  it('парсит обычные форматы', () => {
    expect(parseMoneyString('1234.56')).toBe(1234.56);
    expect(parseMoneyString('1234,56')).toBe(1234.56);
    expect(parseMoneyString('$1,234.56')).toBe(1234.56);
    expect(parseMoneyString('1 234,56')).toBe(1234.56);
  });

  it('не путает разделитель тысяч с десятичным', () => {
    expect(parseMoneyString('1.234,56')).toBe(1234.56);
    expect(parseMoneyString('1,234.56')).toBe(1234.56);
  });

  it('обрабатывает отрицательные суммы', () => {
    expect(parseMoneyString('-45,90')).toBe(-45.9);
  });

  it('возвращает NaN для пустой строки', () => {
    expect(Number.isNaN(parseMoneyString(''))).toBe(true);
  });
});
