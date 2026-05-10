import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabına giriş yaparak sepetine ve siparişlerine erişebilirsin.",
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
