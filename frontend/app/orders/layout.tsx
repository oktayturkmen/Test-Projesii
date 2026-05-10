import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siparişlerim",
  description: "Geçmiş siparişlerini ve durumlarını tek listede gör.",
  robots: { index: false, follow: false },
};

export default function OrdersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
