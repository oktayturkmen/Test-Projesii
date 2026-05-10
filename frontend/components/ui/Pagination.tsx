"use client";

import { FormEvent, useState } from "react";
import { clamp, range } from "@/lib/helpers";

type PaginationProps = {
  currentPage: number;
  lastPage: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  lastPage,
  total,
  isLoading = false,
  onPageChange,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = useState(String(currentPage));
  const safeLastPage = Math.max(1, lastPage);
  const start = clamp(currentPage - 2, 1, safeLastPage);
  const end = clamp(start + 4, 1, safeLastPage);
  const pages = range(Math.max(1, end - 4), end);

  const goToPage = (page: number) => {
    const nextPage = clamp(page, 1, safeLastPage);
    setJumpValue(String(nextPage));
    onPageChange(nextPage);
  };

  const handleJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number.parseInt(jumpValue, 10);

    if (Number.isFinite(parsed)) {
      goToPage(parsed);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-zinc-600 dark:text-zinc-300">
        Sayfa {currentPage} / {safeLastPage} · Toplam {total}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="rounded-md border border-zinc-300 px-3 py-2 font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          Önceki
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            disabled={isLoading}
            aria-current={page === currentPage ? "page" : undefined}
            className="rounded-md border border-zinc-300 px-3 py-2 font-medium aria-[current=page]:bg-brand aria-[current=page]:text-brand-foreground disabled:opacity-50 dark:border-zinc-700"
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= safeLastPage || isLoading}
          className="rounded-md border border-zinc-300 px-3 py-2 font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          Sonraki
        </button>
        <form onSubmit={handleJump} className="flex items-center gap-2">
          <label htmlFor="jump-to-page" className="text-zinc-600 dark:text-zinc-300">
            Sayfaya git
          </label>
          <input
            id="jump-to-page"
            type="number"
            min={1}
            max={safeLastPage}
            value={jumpValue}
            onChange={(event) => setJumpValue(event.target.value)}
            className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </form>
      </div>
    </div>
  );
}

