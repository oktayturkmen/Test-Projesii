"use client";

import { useMemo } from "react";
import { useCurrencyStore } from "@/store/currency.store";
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";

type CurrencySelectorProps = {
  defaultValue?: string;
  options?: string[];
};

export function CurrencySelector({
  defaultValue = BASE_CURRENCY,
  options = [...SUPPORTED_CURRENCIES],
}: CurrencySelectorProps) {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const isCurrencyUpdating = useCurrencyStore((state) => state.isCurrencyUpdating);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const normalizedOptions = useMemo(
    () => options.map((option) => option.toUpperCase()),
    [options]
  );
  const fallbackValue =
    normalizedOptions.includes(selectedCurrency) && selectedCurrency
      ? selectedCurrency
      : normalizedOptions.includes(defaultValue.toUpperCase())
        ? defaultValue.toUpperCase()
        : normalizedOptions[0] ?? BASE_CURRENCY;

  const handleChange = (currency: string) => {
    setCurrency(currency);
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="currency-selector"
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
      >
        Para Birimi
      </label>
      <select
        id="currency-selector"
        value={fallbackValue}
        aria-label="Para birimi seçin"
        aria-busy={isCurrencyUpdating}
        disabled={isCurrencyUpdating}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-xl border border-zinc-300 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:focus:border-brand dark:focus:ring-brand/25"
      >
        {normalizedOptions.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </div>
  );
}
