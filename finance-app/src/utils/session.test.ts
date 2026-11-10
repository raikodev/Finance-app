import { describe, expect, it } from 'vitest';
import { getSessionRemainingMs } from './session';

describe('getSessionRemainingMs', () => {
  it('возвращает null, если срок сессии неизвестен', () => {
    expect(getSessionRemainingMs(null)).toBeNull();
  });

  it('возвращает null для некорректного значения', () => {
    expect(getSessionRemainingMs(Number.NaN)).toBeNull();
    expect(getSessionRemainingMs(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('считает остаток для будущего срока', () => {
    expect(getSessionRemainingMs(1_700_000_000_000, 1_700_000_000_000 - 5_000)).toBe(5_000);
  });

  it('возвращает 0, если сессия уже истекла', () => {
    expect(getSessionRemainingMs(1_700_000_000_000, 1_700_000_001_000)).toBe(0);
    expect(getSessionRemainingMs(1_700_000_000_000, 1_700_000_000_000)).toBe(0);
  });
});
