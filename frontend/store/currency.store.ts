"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  normalizeCurrency,
} from "@/lib/constants";

type CurrencyStore = {
  selectedCurrency: SupportedCurrency;
  isCurrencyUpdating: boolean;
  currencyUpdateId: number;
  setCurrency: (currency: string) => void;
  finishCurrencyUpdate: (updateId?: number) => void;
  supportedCurrencies: readonly SupportedCurrency[];
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: BASE_CURRENCY,
      isCurrencyUpdating: false,
      currencyUpdateId: 0,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      setCurrency: (currency) => {
        const next = normalizeCurrency(currency);
        if (get().selectedCurrency === next) {
          return;
        }
        set((state) => ({
          selectedCurrency: next,
          isCurrencyUpdating: true,
          currencyUpdateId: state.currencyUpdateId + 1,
        }));
      },
      finishCurrencyUpdate: (updateId) => {
        set((state) => {
          if (updateId !== undefined && updateId !== state.currencyUpdateId) {
            return state;
          }

          return { isCurrencyUpdating: false };
        });
      },
    }),
    {
      name: "currency-store",
      partialize: (state) => ({
        selectedCurrency: state.selectedCurrency,
        supportedCurrencies: state.supportedCurrencies,
      }),
    }
  )
);
