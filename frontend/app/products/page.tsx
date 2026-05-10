"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSkeleton } from "@/components/product/ProductSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ProductListSort } from "@/services/product.service";
import { useCurrencyStore } from "@/store/currency.store";
import { useProductStore } from "@/store/product.store";

type SortOption = "" | ProductListSort;

export default function ProductsPage() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const products = useProductStore((state) => state.products);
  const pagination = useProductStore((state) => state.pagination);
  const isLoading = useProductStore((state) => state.isLoading);
  const storeError = useProductStore((state) => state.error);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("");

  useEffect(() => {
    const load = async () => {
      setRequestError(null);
      try {
        await loadProducts(selectedCurrency, page, sort || undefined);
      } catch (requestError) {
        setRequestError(getApiErrorMessage(requestError, "Ürünler alınamadı."));
      }
    };

    load();
  }, [loadProducts, page, selectedCurrency, sort]);

  if (isLoading && products.length === 0) {
    return <ProductSkeleton />;
  }

  if (storeError || requestError) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Ürünler yüklenemedi</p>
        <p className="mt-2">{requestError ?? storeError}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ürün Listesi</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Seçili para birimine göre fiyatlar otomatik güncellenir.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 self-stretch sm:self-end sm:items-end">
          <label htmlFor="product-sort" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Sıralama
          </label>
          <div className="relative w-full min-w-[11rem] sm:w-auto">
            <select
              id="product-sort"
              aria-label="Ürün listesini sırala"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-300 bg-white/90 py-2.5 pl-3 pr-9 text-xs font-semibold tracking-tight text-zinc-800 shadow-sm outline-none transition hover:border-zinc-400 hover:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:focus:border-brand dark:focus:ring-brand/25"
            >
              <option value="">Önerilen</option>
              <option value="price_asc">Fiyat · artan</option>
              <option value="price_desc">Fiyat · azalan</option>
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="opacity-90">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          Henüz ürün bulunmuyor.
        </p>
      ) : (
        <div
          aria-busy={isLoading}
          className={
            isLoading
              ? "pointer-events-none opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <li key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  image={product.image}
                  stock={product.stock}
                  priceInCurrency={product.price_in_currency}
                  selectedCurrency={product.selected_currency}
                  priority={index < 3}
                />
              </li>
            ))}
          </ul>

          <Pagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
