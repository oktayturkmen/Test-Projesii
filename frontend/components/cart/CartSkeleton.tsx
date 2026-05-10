export function CartSkeleton() {
  return (
    <div
      className="w-full animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Sepet yükleniyor"
    >
      <div className="grid grid-cols-5 gap-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

