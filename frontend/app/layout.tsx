import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthHydrator } from "@/components/layout/AuthHydrator";
import { RootChrome } from "@/components/layout/RootChrome";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { getCurrentUserFromCookies } from "@/lib/server/auth";
import "./globals.css";

const brandSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-brand-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // `default` is used as a fallback when a route doesn't override it; the
  // `template` lets every child page write a short title and inherit the
  // site name automatically (e.g. "Sepetim" → "Sepetim | E-Ticaret Test").
  title: {
    default: "E-Ticaret Test",
    template: "%s | E-Ticaret Test",
  },
  description:
    "Sade arayüz, güvenli sepet ve hızlı sipariş — modern bir e-ticaret deneyimi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auth hydration stays server-side: we read the JWT cookie here and ship
  // the `initialUser` prop into a client island. `RootChrome` then decides
  // whether to render the storefront navbar/footer or the bare admin shell
  // based on the live pathname.
  const initialUser = await getCurrentUserFromCookies();

  return (
    <html lang="tr" className={`${brandSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-zinc-900 dark:text-zinc-100">
        <AuthHydrator initialUser={initialUser} />
        <RootChrome>{children}</RootChrome>
        <ToasterProvider />
      </body>
    </html>
  );
}
