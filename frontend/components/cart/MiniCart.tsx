"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { ProductImage } from "@/components/product/ProductImage";
import { useCartStore } from "@/store/cart.store";
import { useCurrencyStore } from "@/store/currency.store";

const PREVIEW_COUNT = 3;

function parsePrice(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20h.01M17 20h.01" />
    </svg>
  );
}

type MiniCartProps = {
  isCartActive: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Desktop-only cart button + popover. Tapping the icon on `/cart` itself
 * just navigates there (no popover) so the user doesn't see a redundant
 * preview of the same data they're already looking at.
 */
export function MiniCart({
  isCartActive,
  isOpen,
  onOpenChange,
}: MiniCartProps) {
  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const cartCount = items.reduce(
    (total, item) => total + Math.max(item.quantity, 0),
    0
  );

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unit = parsePrice(
          item.product?.price_in_currency ?? item.product?.price
        );
        return sum + unit * item.quantity;
      }, 0),
    [items]
  );

  const previewItems = useMemo(() => items.slice(0, PREVIEW_COUNT), [items]);
  const remainingCount = Math.max(items.length - PREVIEW_COUNT, 0);

  const priceCurrency = useMemo(() => {
    const itemCurrency = items.find(
      (item) => item.product?.selected_currency
    )?.product?.selected_currency;
    return (itemCurrency ?? selectedCurrency ?? "TRY").toUpperCase();
  }, [items, selectedCurrency]);

  // Close on outside-click and Escape — both are non-negotiable for a
  // popover that's anchored to a header button.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(target)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const badgeLabel = cartCount > 99 ? "99+" : String(cartCount);
  const ariaLabel = cartCount > 0 ? `Sepet, ${cartCount} ürün` : "Sepet";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Sepet"
        onClick={() => onOpenChange(!isOpen)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
          isCartActive
            ? "text-brand underline decoration-brand decoration-2 underline-offset-[6px] dark:text-brand"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        }`}
      >
        <CartIcon />
        {cartCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold leading-none text-brand-foreground ring-2 ring-white dark:ring-zinc-950">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Sepet özeti"
          className="absolute right-0 z-40 mt-2 w-[22rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Sepetim
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {cartCount > 0
                ? `${cartCount} ürün`
                : isLoading
                  ? "Yükleniyor..."
                  : "Boş"}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Sepetinde henüz ürün yok.
              </p>
              <Link
                href="/products"
                onClick={() => onOpenChange(false)}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition hover:bg-brand-hover"
              >
                Ürünleri keşfet
              </Link>
            </div>
          ) : (
            <>
              <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
                {previewItems.map((item) => {
                  const name =
                    item.product?.name ?? `Ürün #${item.product_id}`;
                  const unit = parsePrice(
                    item.product?.price_in_currency ?? item.product?.price
                  );
                  return (
                    <li key={item.id} className="px-4 py-3.5">
                      <Link
                        href={`/products/${item.product_id}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3.5"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                          <ProductImage
                            src={item.product?.image ?? null}
                            alt={name}
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.quantity} × {unit.toFixed(2)} {priceCurrency}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {remainingCount > 0 && (
                <p className="px-4 pb-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  ve {remainingCount} ürün daha…
                </p>
              )}

              <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Toplam
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {total.toFixed(2)} {priceCurrency}
                  </span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => onOpenChange(false)}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover"
                >
                  Sepete git
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
