import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentUserFromCookies } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Yönetim Paneli | E-Ticaret Test",
  robots: { index: false, follow: false },
};

/**
 * Server-side admin guard. Middleware already enforces token presence for
 * `/admin/*`, but role-checking has to happen here because the JWT payload
 * is opaque at the edge. Non-admin visitors with a valid session are
 * redirected back to the home page; unauthenticated requests never reach
 * this layout in the first place.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUserFromCookies();

  if (!user) {
    redirect("/login?redirect=/admin&reason=auth_required");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Yönetim Paneli
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Oturum: <span className="font-medium text-zinc-700 dark:text-zinc-200">{user.name}</span>
          </span>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Mağazaya Dön
          </Link>
        </div>
      </header>

      <div className="flex w-full flex-col gap-6 md:flex-row">
        <AdminSidebar />
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
