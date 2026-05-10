import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  description: "Aradığın sayfa kaldırılmış veya hiç var olmamış olabilir.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-16 text-center sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        Aradığın sayfa kaldırılmış veya bağlantı eskimiş olabilir. Aşağıdan
        ana sayfaya veya ürünlere dönebilirsin.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover"
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Ürünleri keşfet
        </Link>
      </div>
    </section>
  );
}
