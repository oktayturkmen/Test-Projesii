"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
};

/**
 * `next/image` returns a hard error (server-side 400/500) when the upstream
 * host is rejected by the allowlist or returns a non-2xx response. The
 * `onError` handler runs on the client after Next has bubbled that error up,
 * so a stale URL (e.g. legacy `via.placeholder.com` records still in the DB)
 * collapses cleanly into the same "no image" placeholder we use when the
 * `image` column is null. Keeps the grid layout stable instead of showing a
 * broken/empty tile.
 */
export function ProductImage({ src, alt, sizes, priority }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !src || hasError;

  if (showPlaceholder) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 sm:h-6 sm:w-6"
        >
          <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
          <path d="m4 16 4.5-4.5a2 2 0 0 1 2.8 0L20 20" />
          <path d="m14 14 1.5-1.5a2 2 0 0 1 2.8 0L20 14" />
          <circle cx="9" cy="8" r="1.2" />
        </svg>
        <span className="sr-only">Görsel yok</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}
