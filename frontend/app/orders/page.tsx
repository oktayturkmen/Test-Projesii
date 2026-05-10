"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-error";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { fetchOrders, type OrderSummary } from "@/services/order.service";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOrders(page);

        if (!data.success || !data.data) {
          setError(data.message || "Siparişler alınamadı.");
          return;
        }

        setOrders(data.data.orders ?? []);
        setPagination({
          currentPage: data.data.pagination?.current_page ?? page,
          lastPage: data.data.pagination?.last_page ?? 1,
          total: data.data.pagination?.total ?? 0,
        });
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, "Siparişler alınamadı."));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [page]);

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Siparişler yüklenemedi
        </p>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Siparişlerim</h1>
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Alışverişe devam et
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Sipariş #{order.id}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    Durum: {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Toplam: {order.total_price} {order.currency}
                </p>
              </div>

              {order.items && order.items.length > 0 && (
                <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {order.items.map((item) => {
                    const itemName =
                      item.product_name ??
                      item.product?.name ??
                      `Ürün #${item.product_id}`;
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-4 py-3"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                          <ProductImage
                            src={item.product_image}
                            alt={itemName}
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {itemName}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.quantity} adet · {item.price} {order.currency}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {orders.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          lastPage={pagination.lastPage}
          total={pagination.total}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function EmptyOrders() {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      </span>
      <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Henüz bir siparişin yok
      </h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        İlk siparişin oluştuğunda burada listelenecek.
      </p>
      <Link
        href="/products"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover"
      >
        Ürünleri keşfet
      </Link>
    </section>
  );
}

function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="w-full" aria-label="Siparişler yükleniyor">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="h-9 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <ul className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <li
            key={index}
            className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
