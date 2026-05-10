import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Yeni bir hesap oluştur ve hızlıca alışverişe başla.",
};

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
