"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { isAuthRedirected } from "@/lib/axios";
import { type CartItemDto } from "@/services/cart.service";
import { useCartStore } from "@/store/cart.store";
import { useCurrencyStore } from "@/store/currency.store";

function parsePrice(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function lineTotal(item: CartItemDto): number {
  const price = item.product ? parsePrice(item.product.price_in_currency ?? item.product.price) : 0;
  return price * item.quantity;
}

export default function CartPage() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const storeError = useCartStore((state) => state.error);
  const loadCart = useCartStore((state) => state.loadCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItem = useCartStore((state) => state.updateItem);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setRequestError(null);
      try {
        await loadCart(selectedCurrency);
      } catch (requestError) {
        setRequestError(getApiErrorMessage(requestError, "Sepet yüklenemedi."));
      }
    };

    load();
  }, [loadCart, selectedCurrency]);

  const total = useMemo(() => items.reduce((sum, item) => sum + lineTotal(item), 0), [items]);
  const priceCurrency = useMemo(() => {
    const itemCurrency = items.find((item) => item.product?.selected_currency)?.product?.selected_currency;
    return (itemCurrency ?? selectedCurrency ?? "TRY").toUpperCase();
  }, [items, selectedCurrency]);
  const isRefreshing = isLoading && items.length > 0;

  const handleRemove = async (itemId: number) => {
    setRemovingId(itemId);
    try {
      const data = await removeItem(itemId);

      if (!data.success) {
        toast.error(data.message || "Ürün sepetten kaldırılamadı.");
        return;
      }

      toast.success(data.message || "Ürün sepetten kaldırıldı.");
    } catch (requestError) {
      if (isAuthRedirected(requestError)) return;
      toast.error(getApiErrorMessage(requestError, "Ürün sepetten kaldırılamadı."));
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQuantity = async (item: CartItemDto, nextQuantity: number) => {
    if (nextQuantity < 1) return;

    if (item.product && nextQuantity > item.product.stock) {
      toast.error(`Bu üründen en fazla ${item.product.stock} adet alınabilir.`);
      return;
    }

    setUpdatingId(item.id);
    try {
      const data = await updateItem({ cart_item_id: item.id, quantity: nextQuantity });
      if (!data.success) {
        toast.error(data.message || "Adet güncellenemedi.");
      }
    } catch (requestError) {
      if (isAuthRedirected(requestError)) return;
      toast.error(getApiErrorMessage(requestError, "Adet güncellenemedi."));
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading && items.length === 0) {
    return <CartSkeleton />;
  }

  if (storeError || requestError) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Sepet yüklenemedi
        </p>
        <p className="mt-2">{requestError ?? storeError}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sepet</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Alışverişe devam et
          </Link>
          {items.length > 0 && (
            <Link
              href="/checkout"
              className={`inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover ${
                isRefreshing ? "pointer-events-none opacity-60" : ""
              }`}
            >
              Ödemeye geç
            </Link>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div
          aria-busy={isRefreshing}
          className={
            isRefreshing
              ? "pointer-events-none opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
          {/* Desktop: classic table. Mobile: card list. Sharing the same data
              under two layouts is cheap because the dataset is small and
              Tailwind's `hidden`/`md:hidden` keeps both branches off-screen
              when irrelevant. */}
          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:block">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">{`Birim fiyat (${priceCurrency})`}</th>
                  <th className="px-4 py-3">Adet</th>
                  <th className="px-4 py-3 text-right">Ara toplam</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.map((item) => {
                  const name = item.product?.name ?? `Ürün #${item.product_id}`;
                  const unit = item.product ? parsePrice(item.product.price_in_currency ?? item.product.price) : null;
                  const sub = lineTotal(item);
                  const stock = item.product?.stock ?? Infinity;
                  const isUpdating = updatingId === item.id;
                  const canDecrement = !isUpdating && item.quantity > 1;
                  const canIncrement = !isUpdating && item.quantity < stock;

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link href={`/products/${item.product_id}`} className="hover:underline">
                          {name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {unit !== null ? unit.toFixed(2) : "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        <QuantityStepper
                          quantity={item.quantity}
                          canDecrement={canDecrement}
                          canIncrement={canIncrement}
                          onDecrement={() => handleUpdateQuantity(item, item.quantity - 1)}
                          onIncrement={() => handleUpdateQuantity(item, item.quantity + 1)}
                          ariaLabel={`${name} adet kontrolü`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {sub.toFixed(2)} {priceCurrency}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={removingId === item.id}
                          className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {removingId === item.id ? "Siliniyor..." : "Sil"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Genel toplam
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {total.toFixed(2)} {priceCurrency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((item) => {
              const name = item.product?.name ?? `Ürün #${item.product_id}`;
              const unit = item.product ? parsePrice(item.product.price_in_currency ?? item.product.price) : null;
              const sub = lineTotal(item);
              const stock = item.product?.stock ?? Infinity;
              const isUpdating = updatingId === item.id;
              const canDecrement = !isUpdating && item.quantity > 1;
              const canIncrement = !isUpdating && item.quantity < stock;

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        {name}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Birim: {unit !== null ? unit.toFixed(2) : "-"} {priceCurrency}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="shrink-0 text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {removingId === item.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <QuantityStepper
                      quantity={item.quantity}
                      canDecrement={canDecrement}
                      canIncrement={canIncrement}
                      onDecrement={() => handleUpdateQuantity(item, item.quantity - 1)}
                      onIncrement={() => handleUpdateQuantity(item, item.quantity + 1)}
                      ariaLabel={`${name} adet kontrolü`}
                    />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {sub.toFixed(2)} {priceCurrency}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Mobile-only summary; desktop already shows the total in the table footer. */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Genel toplam
            </span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {total.toFixed(2)} {priceCurrency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type QuantityStepperProps = {
  quantity: number;
  canDecrement: boolean;
  canIncrement: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
  ariaLabel: string;
};

function QuantityStepper({
  quantity,
  canDecrement,
  canIncrement,
  onDecrement,
  onIncrement,
  ariaLabel,
}: QuantityStepperProps) {
  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label="Adedi azalt"
        className="flex h-9 w-9 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        −
      </button>
      <span className="flex h-9 min-w-10 items-center justify-center border-x border-zinc-200 px-2 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={!canIncrement}
        aria-label="Adedi artır"
        className="flex h-9 w-9 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        +
      </button>
    </div>
  );
}

function EmptyCart() {
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
          <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6" />
          <circle cx="10" cy="20" r="1.5" />
          <circle cx="17" cy="20" r="1.5" />
        </svg>
      </span>
      <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Sepetin henüz boş
      </h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Beğendiğin ürünleri ekleyince burada listelenecekler.
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
