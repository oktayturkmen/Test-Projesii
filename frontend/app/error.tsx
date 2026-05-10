"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Keeps error visibility in browser console during development.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto my-10 flex w-full max-w-md flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Geçici sorun
      </p>
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Sayfa şu an yüklenemedi</h2>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        Kısa süreli bir problem oluştu. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz.
      </p>
      {error.digest && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          Hata kodu: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
      >
        Tekrar dene
      </button>
    </div>
  );
}
