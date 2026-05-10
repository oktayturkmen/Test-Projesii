export function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
      aria-label="Ürünler yükleniyor"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-900" />
          <div className="p-3.5 pb-2">
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-1.5 h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="border-t border-zinc-100 px-3.5 pb-3.5 pt-2 dark:border-zinc-800/90">
            <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </li>
      ))}
    </ul>
  );
}
