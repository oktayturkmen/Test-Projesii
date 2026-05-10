import Link from "next/link";
import { ProductCardAddButton } from "@/components/product/ProductCardAddButton";
import { ProductImage } from "@/components/product/ProductImage";

type ProductCardProps = {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  stock: number;
  selectedCurrency?: string;
  priceInCurrency?: string;
  /**
   * Hint to the image optimizer that this card sits above the fold so it
   * should be eagerly fetched. Apply only to the first ~3 cards in a list to
   * avoid trampling the rest of the viewport budget.
   */
  priority?: boolean;
};

export function ProductCard({
  id,
  name,
  description,
  image,
  stock,
  selectedCurrency,
  priceInCurrency,
  priority,
}: ProductCardProps) {
  const hasStock = stock > 0;
  const currencyLabel = selectedCurrency ?? "TRY";
  const priceLabel = priceInCurrency ?? "-";

  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <Link
        href={`/products/${id}`}
        aria-label={`${name} ürün detayını aç`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-100/20 dark:focus-visible:ring-offset-zinc-950"
      >
        <div className="relative aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-900">
          <ProductImage
            src={image}
            alt={`${name} ürün görseli`}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
          />
        </div>

        <div className="p-3.5 pb-2">
          <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{name}</h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {priceLabel}
              <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {currencyLabel}
              </span>
            </span>
            <span
              className={`text-[11px] font-medium ${
                hasStock
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {hasStock ? `Stok ${stock}` : "Stok yok"}
            </span>
          </div>
        </div>
      </Link>

      <div className="border-t border-zinc-100 px-3.5 pb-3.5 pt-2 dark:border-zinc-800/90">
        <ProductCardAddButton productId={id} stock={stock} />
      </div>
    </article>
  );
}
