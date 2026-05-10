"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";
import { isAuthRedirected } from "@/lib/axios";
import { useCartStore } from "@/store/cart.store";

type AddToCartBlockProps = {
  productId: number;
  stock: number;
};

export function AddToCartBlock({ productId, stock }: AddToCartBlockProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clampedQty = Math.min(Math.max(1, quantity), Math.max(stock, 1));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (stock < 1) {
      toast.error("Bu ürün stokta yok.");
      return;
    }

    const qty = Math.min(clampedQty, stock);

    setIsSubmitting(true);
    try {
      const result = await addItem({ product_id: productId, quantity: qty });

      if (!result.success) {
        toast.error(result.message || "Sepete eklenemedi.");
        return;
      }

      toast.success(result.message || "Ürün sepete eklendi.");
    } catch (error) {
      // 401 → axios interceptor zaten /login'e yönlendiriyor; flash kırmızı
      // toast kullanıcıya yarım saniyelik gürültü olur, redirect başlı başına
      // yeterli geri bildirim.
      if (isAuthRedirected(error)) return;
      toast.error(getApiErrorMessage(error, "Sepete eklenemedi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stock < 1) {
    return (
      <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
        Stokta yok; sepete eklenemez.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-24">
        <label htmlFor={`qty-${productId}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Adet
        </label>
        <input
          id={`qty-${productId}`}
          type="number"
          min={1}
          max={stock}
          value={clampedQty}
          onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10) || 1)}
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-60"
      >
        {isSubmitting ? (
          "Ekleniyor..."
        ) : (
          <>
            Sepete ekle
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l2 12h11l2-8H7M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
