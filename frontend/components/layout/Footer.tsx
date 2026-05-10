import Link from "next/link";

const STORE_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Ürünler" },
  { href: "/cart", label: "Sepet" },
];

const ACCOUNT_LINKS: Array<{ href: string; label: string }> = [
  { href: "/orders", label: "Siparişlerim" },
  { href: "/login", label: "Giriş Yap" },
  { href: "/register", label: "Kayıt Ol" },
];

/**
 * Storefront footer rendered by `RootChrome` for non-admin routes.
 *
 * Kept intentionally narrow: only links to routes that actually exist in
 * `app/`. Stub entries like "Hakkımızda" or "SSS" are deliberately omitted
 * so we don't ship dead links — every visible link here resolves to a real
 * page or proxies through middleware.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
                <BagIcon />
              </span>
              E-Ticaret
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Sevdiğin ürünleri almanın en akıllı yolu. Hızlı, güvenli ve
              modern bir alışveriş deneyimi.
            </p>

            <a
              href="mailto:destek@e-ticaret.test"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <MailIcon />
              destek@e-ticaret.test
            </a>
          </div>

          <FooterColumn title="Mağaza" links={STORE_LINKS} />
          <FooterColumn title="Hesap" links={ACCOUNT_LINKS} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center">
          <p>© {year} E-Ticaret Test. Tüm hakları saklıdır.</p>
          <p className="text-zinc-400 dark:text-zinc-500">
            Next.js & Laravel ile geliştirildi.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
