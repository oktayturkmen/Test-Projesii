import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AUTH_COOKIE_NAME } from "@/lib/server/backend";
import { proxyBackendJson } from "@/lib/server/backend-client";
import { getCurrentUserFromCookies } from "@/lib/server/auth";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Genel Bakış",
  description: "Hesabının özeti — siparişlerin, sepetin ve hızlı kısayollar.",
  robots: { index: false, follow: false },
};

type DashboardSnapshot = {
  totalOrders: number;
  cartItemCount: number;
  lastOrder: {
    id: number;
    total_price: string;
    currency: string;
    status: OrderStatus;
  } | null;
};

type OrdersListPayload = {
  data?: {
    orders?: Array<{
      id: number;
      total_price: string;
      currency: string;
      status: OrderStatus;
    }>;
    pagination?: { total?: number };
  };
};

type CartPayload = {
  data?: {
    items?: Array<{ quantity?: number }>;
  };
};

/**
 * Pulls just enough of the user's storefront state to back three lightweight
 * stat cards on `/dashboard`. Both calls run in parallel and the function is
 * intentionally fault-tolerant: if either upstream fails (network drop, 5xx,
 * malformed JSON) we render zero values instead of a broken dashboard.
 *
 * Server-side fetches use the JWT cookie that is already present in the
 * request — no cross-page token plumbing required.
 */
async function loadDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const [ordersResponse, cartResponse] = await Promise.all([
    proxyBackendJson({ path: "/api/orders?per_page=1", token }),
    proxyBackendJson({ path: "/api/cart", token }),
  ]);

  const ordersPayload = (ordersResponse.payload ?? {}) as OrdersListPayload;
  const cartPayload = (cartResponse.payload ?? {}) as CartPayload;

  const totalOrders = ordersPayload.data?.pagination?.total ?? 0;
  const lastOrder = ordersPayload.data?.orders?.[0] ?? null;
  const cartItemCount = (cartPayload.data?.items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );

  return {
    totalOrders,
    cartItemCount,
    lastOrder,
  };
}

export default async function DashboardPage() {
  const [user, snapshot] = await Promise.all([
    getCurrentUserFromCookies(),
    loadDashboardSnapshot(),
  ]);

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Hoş geldin{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Hesabını, siparişlerini ve sepetini buradan yönetebilirsin.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/orders"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover"
          >
            Siparişlerime git
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Sepeti görüntüle
          </Link>
        </div>
      </section>

      {snapshot && (
        <section
          aria-label="Hesap özeti"
          className="grid gap-4 sm:grid-cols-3"
        >
          <StatCard
            label="Toplam sipariş"
            value={String(snapshot.totalOrders)}
            icon={<BoxIcon />}
            href="/orders"
          />
          <StatCard
            label="Sepetteki ürün"
            value={String(snapshot.cartItemCount)}
            icon={<CartIcon />}
            href="/cart"
          />
          <StatCard
            label="Son sipariş"
            value={
              snapshot.lastOrder
                ? `${snapshot.lastOrder.total_price} ${snapshot.lastOrder.currency}`
                : "—"
            }
            hint={
              snapshot.lastOrder
                ? `#${snapshot.lastOrder.id} · ${
                    ORDER_STATUS_LABELS[snapshot.lastOrder.status] ??
                    snapshot.lastOrder.status
                  }`
                : "Henüz sipariş yok"
            }
            icon={<ReceiptIcon />}
            href={snapshot.lastOrder ? "/orders" : undefined}
          />
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </>
  );

  const baseClassName =
    "block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-950";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClassName} hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={baseClassName}>{inner}</div>;
}

function BoxIcon() {
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
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function CartIcon() {
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
      <path d="M3 3h2l2 12h11l2-8H7" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function ReceiptIcon() {
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
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
