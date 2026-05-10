"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";
import { isAuthRedirected } from "@/lib/axios";
import { useCartStore } from "@/store/cart.store";

type ProductCardAddButtonProps = {
  productId: number;
  stock: number;
};

export function ProductCardAddButton({ productId, stock }: ProductCardAddButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (stock < 1) {
      toast.error("Bu ürün stokta yok.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addItem({ product_id: productId, quantity: 1 });

      if (!result.success) {
        toast.error(result.message || "Sepete eklenemedi.");
        return;
      }

      toast.success(result.message || "Ürün sepete eklendi.");
    } catch (error) {
      if (isAuthRedirected(error)) return;
      toast.error(getApiErrorMessage(error, "Sepete eklenemedi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stock < 1) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-[11px] font-medium text-red-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-red-400">
        Stok yok
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="h-3.5 w-3.5 shrink-0"
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
  );
}
