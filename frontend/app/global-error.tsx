"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Uygulama hatası
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Sayfa şu an açılamıyor
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Beklenmeyen bir sorun oluştu. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz.
          </p>
          {error.digest && (
            <p className="mt-3 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              Hata kodu: {error.digest}
            </p>
          )}
          {process.env.NODE_ENV !== "production" && error.message ? (
            <p className="mt-3 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {error.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
