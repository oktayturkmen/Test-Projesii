"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AddToCartBlock } from "@/components/cart/AddToCartBlock";
import { ProductImage } from "@/components/product/ProductImage";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCurrencyStore } from "@/store/currency.store";
import { useProductStore } from "@/store/product.store";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const product = useProductStore((state) => state.currentProduct);
  const isLoading = useProductStore((state) => state.isLoading);
  const storeError = useProductStore((state) => state.error);
  const loadProductDetail = useProductStore((state) => state.loadProductDetail);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setRequestError(null);
      try {
        await loadProductDetail(params.id, selectedCurrency);
      } catch (requestError) {
        setRequestError(getApiErrorMessage(requestError, "Ürün detayı alınamadı."));
      }
    };

    load();
  }, [loadProductDetail, params.id, selectedCurrency]);

  if (isLoading && !product) {
    return (
      <div className="grid w-full gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="space-y-4 lg:pt-6">
          <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (storeError || requestError || !product) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Ürün detayı yüklenemedi</p>
        <p className="mt-2">{requestError ?? storeError ?? "Ürün bulunamadı."}</p>
      </div>
    );
  }

  const hasStock = product.stock > 0;
  const isRefreshing = isLoading && Boolean(product);

  return (
    <div className="w-full">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Ürün listesine dön
      </Link>

      <section
        aria-busy={isRefreshing}
        className={`mt-8 grid gap-10 transition-opacity lg:grid-cols-2 lg:items-start lg:gap-14 ${
          isRefreshing ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
          <ProductImage
            src={product.image}
            alt={`${product.name} ürün görseli`}
            sizes="(min-width: 1024px) 32rem, 100vw"
            priority
          />
        </div>

        <div className="lg:pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Açıklama
            </p>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>
          </div>

          <p className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {product.price_in_currency ?? "-"}
            <span className="ml-2 text-base font-medium text-zinc-500 dark:text-zinc-400">
              {product.selected_currency ?? "TRY"}
            </span>
          </p>

          <p
            className={`mt-2 text-xs font-medium ${
              hasStock
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {hasStock ? `${product.stock} adet stokta` : "Stok yok"}
          </p>

          <AddToCartBlock productId={product.id} stock={product.stock} />
        </div>
      </section>
    </div>
  );
}
