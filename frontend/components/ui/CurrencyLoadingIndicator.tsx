"use client";

import { useEffect, useRef } from "react";

import { useCartStore } from "@/store/cart.store";
import { useCurrencyStore } from "@/store/currency.store";
import { useProductStore } from "@/store/product.store";

const MIN_VISIBLE_MS = 700;
const MAX_VISIBLE_MS = 7000;

export function CurrencyLoadingIndicator() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const isCurrencyUpdating = useCurrencyStore((state) => state.isCurrencyUpdating);
  const currencyUpdateId = useCurrencyStore((state) => state.currencyUpdateId);
  const finishCurrencyUpdate = useCurrencyStore((state) => state.finishCurrencyUpdate);
  const isProductLoading = useProductStore((state) => state.isLoading);
  const isCartLoading = useCartStore((state) => state.isLoading);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isCurrencyUpdating) {
      startedAtRef.current = null;
      return;
    }

    startedAtRef.current = Date.now();
  }, [currencyUpdateId, isCurrencyUpdating]);

  useEffect(() => {
    if (!isCurrencyUpdating) return;

    const startedAt = startedAtRef.current ?? Date.now();
    const maxTimer = window.setTimeout(() => {
      finishCurrencyUpdate(currencyUpdateId);
    }, MAX_VISIBLE_MS);

    if (isProductLoading || isCartLoading) {
      return () => window.clearTimeout(maxTimer);
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
    const finishTimer = window.setTimeout(() => {
      finishCurrencyUpdate(currencyUpdateId);
    }, remaining);

    return () => {
      window.clearTimeout(maxTimer);
      window.clearTimeout(finishTimer);
    };
  }, [
    currencyUpdateId,
    finishCurrencyUpdate,
    isCartLoading,
    isCurrencyUpdating,
    isProductLoading,
  ]);

  if (!isCurrencyUpdating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-0 right-0 top-16 z-40"
    >
      <div className="h-0.5 overflow-hidden bg-brand/10">
        <div className="currency-loading-bar h-full w-1/3 rounded-full bg-brand shadow-[0_0_12px_rgba(15,118,110,0.45)]" />
      </div>
      <div className="mx-auto mt-2 flex w-full max-w-7xl justify-end px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
          <span>Fiyatlar {selectedCurrency} olarak güncelleniyor</span>
        </div>
      </div>
    </div>
  );
}
