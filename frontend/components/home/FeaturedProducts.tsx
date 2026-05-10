"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { fetchProducts, type Product } from "@/services/product.service";
import { useCurrencyStore } from "@/store/currency.store";

const FEATURED_COUNT = 4;

/**
 * Real product strip rendered on the home page.
 *
 * Intentionally bypasses `useProductStore` and uses its own local state so it
 * does NOT collide with the `/products` listing page (both would otherwise
 * fight over the same `products` slice in the store and re-fetch on every
 * navigation back to home).
 *
 * On API failure we render `null` instead of a red error block: this banner
 * is decorative on the home page and a broken "featured" strip is the
 * single fastest way to make a storefront feel like a generated demo.
 */
export function FeaturedProducts() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const currencyUpdateId = useCurrencyStore((state) => state.currencyUpdateId);
  const finishCurrencyUpdate = useCurrencyStore((state) => state.finishCurrencyUpdate);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    // Currency switch keeps the previous strip visible, but dimmed, until the
    // refreshed prices arrive.
    // The new react-hooks/set-state-in-effect rule flags this pattern, but
    // it's the canonical "refetch on input change" idiom — disabling it here
    // is intentional and scoped to a single line.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");

    fetchProducts(selectedCurrency, 1, FEATURED_COUNT)
      .then((data) => {
        if (cancelled) return;
        if (!data.success || !data.data?.products) {
          setStatus("error");
          return;
        }
        setProducts(data.data.products.slice(0, FEATURED_COUNT));
        setStatus("ready");
        finishCurrencyUpdate(currencyUpdateId);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        finishCurrencyUpdate(currencyUpdateId);
      });

    return () => {
      cancelled = true;
    };
  }, [currencyUpdateId, finishCurrencyUpdate, selectedCurrency]);

  if (status === "error") return null;
  if (status === "ready" && products.length === 0) return null;

  const isRefreshing = status === "loading" && products.length > 0;
  const shouldShowSkeleton = status === "loading" && products.length === 0;

  return (
    <section className="border-t border-zinc-200/70 py-12 dark:border-zinc-800/70 lg:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Öne Çıkan Ürünler
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kataloğun en yeni ekleri.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden whitespace-nowrap text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white sm:inline-flex"
        >
          Tümünü gör →
        </Link>
      </div>

      {shouldShowSkeleton ? (
        <ul
          aria-label="Ürünler yükleniyor"
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: FEATURED_COUNT }).map((_, index) => (
            <li
              key={index}
              className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-900" />
              <div className="p-3.5 pb-2">
                <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 flex justify-between">
                  <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="border-t border-zinc-100 px-3.5 pb-3.5 pt-2 dark:border-zinc-800/90">
                <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul
            aria-busy={isRefreshing}
            className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-4 md:grid-cols-3 xl:grid-cols-4 ${
              isRefreshing ? "pointer-events-none opacity-60" : ""
            }`}
          >
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
                  priority={index < 2}
                />
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:hidden">
            <Link
              href="/products"
              className="block rounded-xl border border-zinc-200 bg-white py-3 text-center text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
            >
              Tüm ürünleri gör →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
