import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Sepetindeki ürünleri görüntüle, miktarı güncelle veya kaldır.",
  robots: { index: false, follow: false },
};

export default function CartLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
