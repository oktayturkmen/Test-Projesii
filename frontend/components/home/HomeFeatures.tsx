import type { ReactNode } from "react";

type TrustItem = {
  label: string;
  icon: ReactNode;
};

const PROMISES: TrustItem[] = [
  { label: "Hızlı teslimat", icon: <TruckIcon /> },
  { label: "Güvenli ödeme", icon: <ShieldIcon /> },
  { label: "Kolay iade", icon: <RefreshIcon /> },
  { label: "Destek hattı", icon: <ChatIcon /> },
];

/**
 * Slim, single-line trust strip rendered between the featured products
 * grid and the contact section. The previous version was a four-column
 * card row with hero-sized typography; on a storefront where there is
 * already plenty of product imagery above and a contact card below, that
 * card stack just adds visual noise. A subtle horizontal band keeps the
 * page rhythm tighter without losing the "we ship / we refund / we
 * support" reassurance copy.
 */
export function HomeFeatures() {
  return (
    <section
      aria-label="Müşteri vaatleri"
      className="border-y border-zinc-200/70 bg-zinc-50/60 dark:border-zinc-800/70 dark:bg-zinc-900/40"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-600 dark:text-zinc-400 sm:justify-between">
          {PROMISES.map((promise) => (
            <li
              key={promise.label}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-zinc-500 dark:text-zinc-400">
                {promise.icon}
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {promise.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TruckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 6h11v10H3z" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
      <path d="M9 12l2.5 2.5L15 11" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 12a8 8 0 0 1 14-5.3L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-14 5.3L4 16" />
      <path d="M4 20v-4h4" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M9 10h.01M12 10h.01M15 10h.01" />
    </svg>
  );
}
