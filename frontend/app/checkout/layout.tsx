import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sipariş Onayı",
  description:
    "Sipariş özetini incele ve siparişini güvenle tamamla.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
