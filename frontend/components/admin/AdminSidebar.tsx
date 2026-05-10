"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/users", label: "Kullanıcılar" },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 md:w-56">
      <nav aria-label="Yönetim menüsü">
        <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.exact);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-brand-foreground"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
