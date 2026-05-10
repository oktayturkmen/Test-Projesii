"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MiniCart } from "@/components/cart/MiniCart";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Ürünler" },
];

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20h.01M17 20h.01" />
    </svg>
  );
}

function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CartLink({
  pathname,
  cartCount,
  onClick,
}: {
  pathname: string;
  cartCount: number;
  onClick?: () => void;
}) {
  const badgeLabel = cartCount > 99 ? "99+" : String(cartCount);
  const ariaLabel = cartCount > 0 ? `Sepet, ${cartCount} ürün` : "Sepet";

  return (
    <Link
      href="/cart"
      aria-label={ariaLabel}
      title="Sepet"
      onClick={onClick}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
        pathname === "/cart"
          ? "text-brand underline decoration-brand decoration-2 underline-offset-[6px] dark:text-brand"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      }`}
    >
      <CartIcon />
      {cartCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold leading-none text-brand-foreground ring-2 ring-white dark:ring-zinc-950">
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + Math.max(item.quantity, 0), 0)
  );
  const loadCart = useCartStore((state) => state.loadCart);
  const clearCart = useCartStore((state) => state.clear);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  useEffect(() => {
    if (hasCheckedSession) {
      return;
    }

    const syncAuth = async () => {
      try {
        await fetchMe();
      } catch {
        // Cookie yoksa veya token geçersizse navbar guest modda kalır.
      }
    };

    syncAuth();
  }, [fetchMe, hasCheckedSession]);

  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }

    if (!isAuthenticated) {
      clearCart();
      return;
    }

    // Navbar badge only needs the item count — it is currency-agnostic.
    // Re-fetching whenever `selectedCurrency` changes used to fire a parallel
    // request alongside the page-level products fetch, queueing both behind
    // the single-threaded `php artisan serve` worker on Windows.
    const syncCart = async () => {
      try {
        await loadCart();
      } catch {
        // Navbar badge is best-effort; cart page still shows actionable errors.
      }
    };

    syncCart();
  }, [clearCart, hasCheckedSession, isAuthenticated, loadCart]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setIsMobileMenuOpen(false);
      setIsUserDropdownOpen(false);
      setIsMiniCartOpen(false);
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          E-Ticaret <span className="text-brand">Test</span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <ul className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 transition ${
                      isActive
                        ? "font-semibold text-brand underline decoration-brand decoration-2 underline-offset-[6px] dark:text-brand"
                        : "hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <MiniCart
            isCartActive={pathname === "/cart"}
            isOpen={isMiniCartOpen}
            onOpenChange={(nextOpen) => {
              setIsMiniCartOpen(nextOpen);
              if (nextOpen) {
                setIsUserDropdownOpen(false);
              }
            }}
          />
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUserDropdownOpen((prev) => {
                    const nextOpen = !prev;
                    if (nextOpen) {
                      setIsMiniCartOpen(false);
                    }
                    return nextOpen;
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-expanded={isUserDropdownOpen}
                aria-haspopup="menu"
                aria-controls="user-navigation"
              >
                <span>{user?.name ?? "Hesabım"}</span>
                <ChevronDownIcon isOpen={isUserDropdownOpen} />
              </button>
              {isUserDropdownOpen && (
                <div
                  id="user-navigation"
                  className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Genel Bakış
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Hesabım
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Siparişler
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="block rounded px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                    >
                      Yönetim Paneli
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
            >
              Giriş Yap
            </Link>
          )}
          <CurrencySelector />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartLink
            pathname={pathname}
            cartCount={cartCount}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <CurrencySelector />
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setIsUserDropdownOpen(false);
              setIsMiniCartOpen(false);
            }}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            Menu
          </button>
        </div>
      </nav>
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/60 bg-white/95 px-4 py-3 dark:border-zinc-800/70 dark:bg-zinc-950/95 md:hidden"
        >
          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-md px-3 py-2 transition ${
                    isActive
                      ? "border-l-2 border-brand bg-brand/10 font-semibold text-zinc-900 dark:border-brand dark:bg-brand/15 dark:text-zinc-50"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Genel Bakış
                </Link>
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Hesabım
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Siparişler
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-md px-3 py-2 font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                  >
                    Yönetim Paneli
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-left text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md bg-brand px-3 py-2 text-brand-foreground transition hover:bg-brand-hover"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
