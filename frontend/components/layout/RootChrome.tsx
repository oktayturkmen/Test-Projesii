"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CurrencyLoadingIndicator } from "@/components/ui/CurrencyLoadingIndicator";

/**
 * Splits the application into two top-level shells:
 *
 *   1. Customer storefront — uses the global Navbar + footer + max-width
 *      content frame defined here. Default for every non-`/admin/*` route.
 *   2. Admin panel          — bare frame, no customer navbar/footer. The
 *      admin's own header + sidebar is rendered by `app/admin/layout.tsx`,
 *      so layering the customer chrome on top of it would just produce
 *      duplicated branding and cramp the dashboard horizontally.
 *
 * Done via a client component because the root layout is a Server Component
 * and `usePathname` is the simplest way to discriminate without forcing the
 * whole layout client-side. Auth hydration + SSR user fetch stay on the
 * server side in `RootLayout`.
 */
export function RootChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminShell = pathname?.startsWith("/admin") ?? false;

  if (isAdminShell) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <CurrencyLoadingIndicator />
      {/*
        `flex-col` is load-bearing: pages that render multiple top-level
        siblings (e.g. home page hero + feature strip) would otherwise be
        laid out side-by-side as flex-row items and collapse the second
        sibling into a sliver in the remaining horizontal space.
      */}
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
