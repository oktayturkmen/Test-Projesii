"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { createOrder, type CreatedOrder } from "@/services/order.service";
import { useCartStore } from "@/store/cart.store";
import { useCurrencyStore } from "@/store/currency.store";

const USER_FRIENDLY_CHECKOUT_ERROR =
  "Sipariş şu anda oluşturulamıyor. Lütfen kısa bir süre sonra tekrar deneyin.";

export default function CheckoutPage() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const items = useCartStore((state) => state.items);
  const isCartLoading = useCartStore((state) => state.isLoading);
  const cartError = useCartStore((state) => state.error);
  const loadCartItems = useCartStore((state) => state.loadCart);
  const clearCart = useCartStore((state) => state.clear);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        await loadCartItems(selectedCurrency);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, "Sepet bilgisi alınamadı."));
      }
    };

    load();
  }, [loadCartItems, selectedCurrency]);

  const orderTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = Number.parseFloat(item.product?.price_in_currency ?? item.product?.price ?? "0");
        const normalized = Number.isFinite(unitPrice) ? unitPrice : 0;
        return sum + normalized * item.quantity;
      }, 0),
    [items]
  );

  const priceCurrency = useMemo(() => {
    const cartCurrency = items.find((item) => item.product?.selected_currency)?.product?.selected_currency;
    return (cartCurrency ?? selectedCurrency ?? "TRY").toUpperCase();
  }, [items, selectedCurrency]);
  const isCartRefreshing = isCartLoading && items.length > 0;

  const handleCheckout = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await createOrder({ currency: priceCurrency });

      if (!data.success || !data.data?.order) {
        // Keep technical details in logs, show stable user-facing message.
        console.error("Checkout create order failed:", data);
        setError(USER_FRIENDLY_CHECKOUT_ERROR);
        toast.error(USER_FRIENDLY_CHECKOUT_ERROR);
        return;
      }

      setCreatedOrder(data.data.order);
      clearCart();
      toast.success(data.message || "Sipariş oluşturuldu.");
    } catch (requestError) {
      console.error("Checkout request error:", {
        message: getApiErrorMessage(requestError, USER_FRIENDLY_CHECKOUT_ERROR),
      });
      setError(USER_FRIENDLY_CHECKOUT_ERROR);
      toast.error(USER_FRIENDLY_CHECKOUT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Sipariş Onayı</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Sepetindeki ürünleri gözden geçir ve siparişini onayla.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {isCartLoading && items.length === 0 ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            Sepetiniz boş görünüyor. Sipariş oluşturmadan önce ürün ekleyin.
          </div>
        ) : (
          <div
            aria-busy={isCartRefreshing}
            className={`mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-opacity dark:border-zinc-800 dark:bg-zinc-900/40 ${
              isCartRefreshing ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sipariş Özeti</h2>
            {priceCurrency !== selectedCurrency && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Sepet tutarlılığı için özet, sepetten gelen para birimi ({priceCurrency}) ile gösteriliyor.
              </p>
            )}
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((item) => {
                const unit = Number.parseFloat(item.product?.price_in_currency ?? item.product?.price ?? "0");
                const unitPrice = Number.isFinite(unit) ? unit : 0;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.product?.name ?? `Ürün #${item.product_id}`} x {item.quantity}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {(unitPrice * item.quantity).toFixed(2)} {priceCurrency}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-zinc-200 pt-3 text-right text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
              Genel Toplam: {orderTotal.toFixed(2)} {priceCurrency}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isSubmitting || isCartLoading || items.length === 0}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sipariş oluşturuluyor..." : "Siparişi oluştur"}
        </button>

        {(error || cartError) && (
          <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
            {error ?? cartError}
          </p>
        )}

        {createdOrder && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
              </svg>
              <p className="font-semibold">Sipariş başarıyla oluşturuldu.</p>
            </div>
            <dl className="mt-3 grid gap-1.5 text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Sipariş No</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{createdOrder.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Durum</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{createdOrder.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Toplam</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {createdOrder.total_price} {createdOrder.currency}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link
                href="/orders"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
              >
                Siparişlerime git →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
