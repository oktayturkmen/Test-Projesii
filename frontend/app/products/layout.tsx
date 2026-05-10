import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ürünler",
  description:
    "Güncel kataloğu incele, fiyatlar seçili para birimine göre otomatik güncellenir.",
};

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
