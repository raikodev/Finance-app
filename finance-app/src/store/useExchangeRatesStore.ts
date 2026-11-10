import { create } from 'zustand';
import { fetchLiveRates } from '../services/exchangeRates';
import { MOCK_RATES } from '../utils/currency';

interface ExchangeRatesState {
  rates: Record<string, number>;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
  fetchRates: (force?: boolean) => Promise<void>;
}

const ONE_HOUR = 60 * 60 * 1000;

export const useExchangeRatesStore = create<ExchangeRatesState>((set, get) => ({
  rates: MOCK_RATES,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchRates: async (force = false) => {
    const { lastFetched } = get();
    // force = true — ручной retry из UI, игнорирует часовой кэш
    if (!force && lastFetched && Date.now() - lastFetched < ONE_HOUR) return;

    set({ isLoading: true, error: null });
    try {
      const rates = await fetchLiveRates();
      set({ rates, isLoading: false, lastFetched: Date.now() });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch exchange rates' });
    }
  },
}));